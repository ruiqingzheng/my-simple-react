import Component from '../react/component.js';
import setAttribute from './dom.js';


/***
 *  入口, 将dom 挂载到container
 * @param dom
 * @param vnode
 * @param container
 */
export function diff(dom, vnode, container) {
  let ret = diffNode(dom, vnode)

  if (container && ret.parentNode !== container) {
    container.appendChild(ret);
  }

  return ret;
}

/***
 * 比较组件的真实dom和将渲染的虚拟dom
 * 并返回更新后的dom
 * @param dom
 * @param vnode
 */
function diffNode(dom, vnode) {
  // out保存更新后的结果
  let out = dom;

  // 如果是文本或数字或布尔这些基本类型则直接更新并返回结果
  if (vnode === undefined || vnode === null
    || typeof vnode === 'boolean') vnode = '';

  if (typeof vnode === 'number') vnode = String(vnode);

  if (typeof  vnode === 'string') {
    // 如果当前dom本身就是文本, 则更新
    if (dom && dom.nodeType === 3) {
      if (dom.textContent != vnode) {
        dom.textContent = vnode;
      }
    } else { // 当前dom不是文本节点, 则新建文本节点dom且移除原来的节点, 用replaceChild
      out = document.createTextNode(vnode);
      if (dom && dom.parentNode) {
        dom.parentNode.replaceChild(out, dom)
      }
    }

    return out;
  }

  // 如果是函数组件, 或者是嵌套的组件标签, 那么调用diffComponent会先将jsx解析
  // 设置属性等操作, 然后再回到diffNode中, 继续重新比较

  if (typeof vnode.tag === "function") {
    out = diffComponent(dom, vnode);
    console.log("Log: vnode.tag is function, out:", out);
    return out
  }

  // 如果dom不存在说明是第一次渲染, 如果是不同类型那么也需要重新渲染
  if (!dom || !isSameNodeType(dom, vnode)) {

    out = document.createElement(vnode.tag);


    // 如果是已经渲染过的不同类型的组件, 那么将原来的子节点移动到新节点
    if (dom) {
      // 原来的dom下的子节点是数组, 所以需要循环操作放到新节点
      // 先将dom.childNodes 都放到out 下面 ;
      // 然后将dom的parentNode.replaceChild把dom替换为out, 则删除了dom原有的dom
      // dom.childNodes.map(
      //   (child) => {
      //     out.appendChild(child)
      //   }
      // )
      [...dom.childNodes].map(out.appendChild);

      // 删除原来的dom
      if (dom.parentNode) {
        dom.parentNode.replaceChild(out, dom);
      }
    }
  }

  // 对虚拟dom的children进行操作

  if (vnode.children && vnode.children.length > 0 || ( out.childNodes && out.childNodes.length > 0 )) {
    diffChildren(out, vnode.children);
  }

  // 设置属性
  diffAttributes(out, vnode);

  return out;

}

function diffAttributes(dom, vnode) {
  const old = {};       // 当前DOM的属性
  const v_attrs = vnode.attrs;  // 虚拟DOM的属性

  // 把当前DOM的属性都以对象形式存放
  for (let i = 0; i < dom.attributes.length; i++) {
    const attr = dom.attributes[i];
    old[attr.name] = attr.value;
  }

  // 如果原来的属性不在新的属性当中，则将其移除掉（属性值设为undefined）
  for (let name in old) {
    if (!(name in v_attrs)) {
      setAttribute(dom, name, undefined);
    }
  }

  // 只需要更新属性值发生变化的属性
  // 包括不存在的, 原本不存在的属性则是undefined, 所以这样的新的属性也会被设置
  for (let name in v_attrs) {
    if (old[name] !== v_attrs[name]) {
      setAttribute(dom, name, v_attrs[name])
    }
  }
}


function isSameNodeType(dom, vnode) {
  if (typeof vnode === "string" || typeof vnode === 'number') {
    return dom.nodeType === 3;
  }

  if (typeof  vnode.tag === "string") {
    return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase();
  }

  // 如果是组件类型则比较constructor
  return dom && dom._component && dom._component.constructor === vnode.tag;
}
/***
 * 比较dom下的子节点
 * @param dom 组件标签dom
 * @param vchildren  数组, 是虚拟dom对象中的children数组
 */

function diffChildren(dom, vchildren) {
  const domChildren = dom.childNodes;
  const children = [];  // 没有key的子节点
  const keyed = {}; // 有key的子节点

  // 对已有的dom下的子节点进行按key放到数组中
  if (domChildren.length > 0) {
    for (let i = 0; i < domChildren.length; i++) {
      const child = domChildren[i];
      const key = child.key;
      if (key) {
        keyedLen++;
        keyed[key] = child;
      } else {
        children.push(child)
      }
    }
  }

  if (vchildren && vchildren.length > 0) {
    let min = 0;
    let childrenLen = children.length


    for (let i = 0; i < vchildren.length; i++) {
      const vchild = vchildren[i];
      const key = vchild.key;
      let child;

      if (key) {
        if (keyed[key]) { // 如果对应的key子节点存在
          child = keyed[key];  // 将已经存在子节点赋值给待渲染的子节点
          keyed[key] = undefined;
        }
      } else if (min < childrenLen) { // 如果没有key，则优先找类型相同的节点
        for (let j = min; j < childrenLen; j++) {
          let c = children[j];  // 没有key的子节点
          if (c && isSameNodeType(c, vchild)) {
            child = c
            // 如果找到类型相同的节点, 那么就已经确定了该节点对应的vchild, 那么就应该从无序子节点中去掉该节点. 避免重复比较
            children[j] = undefined;
            if (j === childrenLen - 1) childrenLen--; // 如果去掉的节点正好是最后一个节点,那么数组长度应该减一 , 避免下次vchild 比较的时候还要比较最后一个不存在的节点
            if (j === min) min++; // 如果去掉的节点是第一个节点, 那么下次比较就从后面一个开始, 而不是从第一个开始
            break;
          }
        }
      }

      // 上面if做的都只是在确定要比较的child和vchild
      child = diffNode(child, vchild); // 更新后的child
      const f = domChildren[i];
      if (child && child !== dom && child !== f) {
        // 如果更新前的对应位置为空，说明此节点是新增的
        if (!f) {
          dom.appendChild(child);
        } else if (child === f.nextSibling) {
          // 如果更新后的节点和更新前对应位置的下一个兄弟节点一样，说明当前位置的节点被移除了
          // 而且child就没有必要添加了, 因为移除当前子节点, 其后的兄弟节点和child是一样的
          removeNode(f);
        } else {// 将更新后的节点移动到正确的位置
          // 注意insertBefore的用法，第一个参数是要插入的节点，第二个参数是已存在的节点
          dom.insertBefore(child, f);
        }
      }
    }
  }
}

function setComponentProps(component, props) {

  if (!component.base) { // 如果组件没有base真实dom, 也就是没有被渲染过, 那么执行生命周期componentWillMount
    if (component.componentWillMount) component.componentWillMount();
  } else if (component.componentWillReceiveProps) { // 否则该组件是曾经渲染过的, 这里只是更新属性, 于是执行生命周期 componentWillReceiveProps
    component.componentWillReceiveProps();
  }

  component.props = props
  renderComponent(component);
}


/***
 * 调用
 * @param dom
 * @param vnode
 */
function diffComponent(dom, vnode) {
  let c = dom && dom._component; // old dom's component obj
  let oldDom = dom;

  // 是否已经渲染过, 通过判断dom._component是否存在, 渲染过且类型没有变化话, 那么只需要重新setComponentProps, 并调用renderComponent
  if (c && c.constructor == vnode.tag) {

    setComponentProps(c, vnode.attrs);
    dom = c.base;
  } else {
    // 如果渲染过, 但是类型不对, 那么还是需要重新渲染

    if (c) {
      unmountComponent(c);
      oldDom = null;
    }
    // 如果没有渲染过, 则createComponent, 然后再setComponentProps并renderComponent
    c = createComponent(vnode.tag, vnode.attrs);
    setComponentProps(c, vnode.attrs);

    dom = c.base;
    // 删除oldDom , 但要判断更新的dom是否不等于oldDom, 否则会把更新的dom给删除了
    // 如果oldDom 没有base属性 , 且新的dom的props没有变化, 才可能出现 dom == oldDom
    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      removeNode(oldDom)
    }
  }
  return dom
}


/***
 * 执行生命周期方法willUnmount 且删除当前组件
 * @param component
 */
function unmountComponent(component) {
  if (component.componentWillUnmount) {
    component.componentWillUnmount()
  }
  removeNode(component.base);
}

/***
 * 调用 component.render() 得到jsx
 * 并渲染该组件 base = diffNode( component.base, renderer );
 * @param component
 */
export function renderComponent(component) {
  let base;

  const renderer = component.render();

  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate();
  }

  // console.log("before diffNode component base ", component.base);
  base = diffNode(component.base, renderer);
  // console.log("runing here...base", base)
  component.base = base;
  base._component = component;

  if (component.base) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate();
    }
    // 如果base不存在说明是第一次渲染, 则执行componentDidMount生命周期方法
  } else if (component.componentDidMount) {
    component.componentDidMount();
  }

  // component.base = base;
  // base._component = component;

}


function createComponent(component, props) {
  let inst;

  if (component.prototype && component.prototype.render) {
    inst = new component(props);
  } else if (typeof component === 'function') {
    inst = new Component(props);
    inst.constructor = component
    // inst.render = component;  // 这样不行吗
    inst.render = function () {
      return this.constructor(props);
    }

  }
  return inst
}


function removeNode(dom) {
  // if (dom && dom.parentNode) {
  //   dom.parentNode.removeChild(dom);
  // }

  if (dom && dom.parentNode) {
    dom.parentNode.removeChild(dom);
  }
}

