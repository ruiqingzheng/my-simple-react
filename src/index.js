// 对createElement的实现非常简单，只需要返回一个对象来保存它的信息就行了。
function createVDOM(tag, attrs, ...children) {
  // console.log("ret running createElement");
  return {
    tag,
    attrs,
    children
  }
}
// 定义react对象, 且声明定义createElement方法, 该方法和babelrc中是对应的, 可以改名
const Ret = {
  createVDOM
}

function render(vnode, container) {
  // 当vnode为字符串时，渲染结果是一段文本,且返回退出
  if (typeof vnode === 'string') {
    const textNode = document.createTextNode(vnode);
    return container.appendChild(textNode)
  }

  // 否则是一个VDOM对象, 包含tag标签, attr等标签
  const dom = document.createElement(vnode.tag);

  // 遍历属性, 且设置该html元素的属性
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const value = vnode.attrs[key];
      setAttribute(dom, key, value);
    })
  }
  // 递归渲染子节点
  vnode.children.forEach(child => {
    render(child, dom);
  })

  // 渲染好的dom挂载到根/父节点
  return container.appendChild(dom);
}


// 设置dom节点的属性, 比如style, class和事件
function setAttribute(dom, name, value) {
  // 如果属性名是class，则改回className
  if (name === "className") name = "class";
  // 如果属性名是onXXX，则是一个时间监听方法, dom的格式是onxxx 小写形式
  // /on[A-Z]\w+/.test(name)
  if(/on\w+/.test(name)) {
    name = name.toLowerCase();
    dom[name] = value || '';
  } else if(name === "style") {// 如果属性名是style，则更新style对象
    if(!value || typeof value === "string") { // 如果样式为空或者是字符串形式 比如 style: "color: red" , 那么直接设置`dom.style.cssText`
      dom.style.cssText = value;
    } else if(value && typeof value === "object"){ // 如果样式为对象键值对
      for(let csskey in value) {
        // 可以通过style={ width: 20 }这种形式来设置样式，可以省略掉单位px
        dom.style[csskey] = typeof value[csskey] == 'number' ? value[csskey] + 'px' : value[csskey];
      }
    }
  } else { // 其他属性则直接更新
    if(name in dom) { // dom中已有的属性, 那么用新值覆盖
      dom[name] = value || "" ;
    }

    // dom 中没有的其他属性,  如果有值, 那么新加入该属性, 如果为空, 表示要删除该属性
    // setAttribute不会更新css值, 因此上面才需要单独把css进行处理
    if(value) {
      dom.setAttribute()
    } else {
      dom.removeAttribute(name);
    }
  }
}

// 仿reactDOM功能
retDOM = {
  render: (vnode, container) => {
    container.innerHTML = '';
    return render(vnode, container);
  },
}

function onclick(e){
  console.log("clicked element, e : ", e);
}

const element = (
  <div onClick={onclick}>
    <h2>click me!</h2>
    <span>hello world!</span>
  </div>
)

console.log(element);

// retDOM.render(element, document.getElementById('root'));

function tick() {
  const ele = (
    <div onClick={onclick}>
      hello<span>world!</span>
      <h2>It is {new Date().toLocaleTimeString()}</h2>
    </div>
  );

  retDOM.render(ele, document.getElementById('root'));
}

setInterval(tick, 1000);
