import setAttribute from "./dom.js";
import Component from "../react/component.js"

/***
 * 渲染react.Component对象
 * 这里的改变是通过给component对象添加basedom属性来判断该组件是否已经存在, 如果存在那么就只是更新操作
 * @param component , react.Component对象
 */
export function renderComponent (component) {
  let basedom; // 新dom ,用来保存该组件的真实dom, 可以判断该组件是否被渲染过
  const renderer = component.render();  // 这个实际得到的就是JSX

  if ( component.basedom && component.componentWillUpdate ) {
    component.componentWillUpdate();
  }

  basedom = _render(renderer)// renderer是JSX, 这里babel会解析jsx, 然后调用和传参给react.createElement,  createElement直接返回接收到的虚拟dom对象
  // 于是_render接收到的是解析后的虚拟dom对象

  // 生命周期, 在调用_render方法后, 组件就已经渲染完毕, 但可能还没有挂载
  // 如果这里是第二次调用renderComponent方法,  _render方法后, 组件更新渲染就已经完毕
  // component.basedom 是该组件原有的真实dom
  if(component.basedom) {
    if(component.componentDidUpdate) component.componentDidUpdate();
  } else if(component.componentDidMount) { // 第一次渲染该组件则调用componentDidMount生命周期方法
    component.componentDidMount();
  }

  // 上面生命周期方法执行后, 如果是更新操作, 那么将新的dom挂载更新
  // 第一次的根节点的挂载是调用的_render方法, 其子节点的挂载也是在调_render方法
  if(component.basedom && component.basedom.parentNode){
    component.basedom.parentNode.replaceChild(basedom, component.basedom)
  }

  component.basedom = basedom;    // 设置component对象的basedom属性为真实dom
  // basedom._component = component; // 设置真实dom的_component属性为component对象, 暂时没有用到
}
/***
 * 使用该方法将函数组件扩展为Component对象
 * 且嵌套的组件名也会被解析为函数, 所以, 嵌套的组件的处理流程和函数组件处理流程是一样的
 * @param tag 参数1: 对应的是vnode.tag, 可能是函数组件的函数名, 也可能是嵌套组件的类名
 * @param props 参数2: props , 对应的是vnode.attrs
 * @returns {*} 返回react.Component对象
 */
function createComponent(tag, props){
  let inst;
  if(tag.prototype && tag.prototype.render) {// 如果已经是类定义组件
    inst = new tag(props);
  }else if(typeof tag == "function") { // 如果是函数定义组件, 那么包装为类定义组件
    inst = new Component(props);
    inst.constructor = tag ; // 依然保留它的构造函数是原tag方法
    inst.render = function() { // 设置render方法
      return this.constructor(props);  // 也就是调用原tag方法, 返回JSX
    }
  }
  return inst;
}

/***
 * 该方法设置component属性后 , 将component作为参数调用renderComponent方法, 它返回渲染的真实dom
 * @param component   , 类定义的组件对象
 * @param props  ,  vnode 虚拟dom的attrs属性
 * @return 更新props后render得到的dom
 */
function setComponentProps(component,props) {
  // 加入生命周期
  if(!component.basedom) { // 如果组件没有base真实dom, 也就是没有被渲染过, 那么执行生命周期componentWillMount
    if(component.componentWillMount) component.componentWillMount();
  } else if(component.componentWillReceiveProps) { // 否则该组件是曾经渲染过的, 这里只是更新属性, 于是执行生命周期 componentWillReceiveProps
    component.componentWillReceiveProps();
  }
  component.props = props
  // props 更新了, 于是需要重新进行渲染, 但这里不要再用return , 因为renderComponent里面有return
  renderComponent(component);
}

/***
 * 根据vnode虚拟dom对象来渲染和挂载真实dom, 并返回真实dom
 * @param vnode  虚拟dom对象 {  tag,  attrs,  children }
 * @returns 返回真实dom
 */

function _render(vnode) {
  // console.log("_render's vnode:", vnode)
  if(vnode === undefined || vnode === null || typeof vnode === "boolean") vnode = "";

  if(typeof vnode === "number") vnode = String(vnode);

  // vnode 本应当是虚拟dom对象, 但如果它本身没有标签, 只有一段文本, 那么vnode就是string类型
  // 当vnode为字符串时，渲染结果是一段文本,且返回退出
  if (typeof vnode === "string") {
    let txtNode = document.createTextNode(vnode);
    // return container.appendChild(textNode)
    return txtNode;
  }

  // 如果tag是function , 那么就先统一为组件 createComponent
  if(typeof vnode.tag === "function" ){
    // console.log("handling function tag:" , vnode.tag);
    const component = createComponent(vnode.tag, vnode.attrs)
    // 然后调用setComponentProps方法进行渲染, 它会将渲染后的dom保存在 component.base
    setComponentProps(component,vnode.attrs)
    return component.basedom;
  }

  // 否则是一个VDOM对象, 包含tag标签, attr等标签
  // 而且这里的tag标签是被处理过的 , 一定是html标签, 而不会是方法名, 或者组件名
  const dom = document.createElement(vnode.tag);

  // 设置刚创建的dom对象的属性
  // setAttribute 方法, 参数1, 刚创建的真实dom ; 参数2,
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const value = vnode.attrs[key];
      setAttribute(dom, key, value);
    })
  }

  // 如果有子节点
  if(vnode.children) {
    vnode.children.forEach(child => {
      render(child, dom);   // 递归渲染子节点, 且挂载
    })
  }

  return dom
}

// render 根据传递过来的虚拟dom对象来渲染为真实dom 且将渲染好的dom挂载到根/父节点
export function render(vnode, container) {
  // 渲染好的dom挂载到根/父节点
  return container.appendChild(_render(vnode));
}

