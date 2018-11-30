// 给dom对象设置属性, 设置dom节点的属性, 比如style, class和事件
// 参数1: 实际的dom对象
// 参数2: key
// 参数3: value

function setAttribute(dom, name, value) {
  // 如果属性名是class，则改回className
  if (name === "className")  name = "class";

  // 如果属性名是onXXX，则是一个时间监听方法, dom的格式是onxxx 小写形式
  if (/on\w+/.test(name)) {  // 或者 // /on[A-Z]\w+/.test(name)
    // 事件名称, html规范是全小写
    name = name.toLowerCase();
    // 设置事件
    // dom.addEventListener(name, value);
    dom[name] = value || "";
    // console.log(`event listener name: ${name} ; value : ${value}`);
  } else if (name === "style") { // 如果属性名是style，则更新style对象
    if (typeof value === "string" || value == "") { // 如果样式为空或者是字符串形式 比如 style: "color: red" , 那么直接设置`dom.style.cssText`
      dom.style.cssText = value;
    } else if (value && typeof value === "object") {   // 如果样式为对象键值对
      // 可以通过style={ width: 20 }这种形式来设置样式，可以省略掉单位px
      for (let csskey in value) {
        dom.style[csskey] = typeof value[csskey] == 'number' ? value[csskey] + 'px' : value[csskey];
      }
    }
  } else {  // 其他属性 , 既不是onXXX的方法事件, 也不是style, 那么则判断如果已经存在则更新, 比如更新class属性

    if (name in dom) { // dom中已有的属性, 那么用新值覆盖
      dom[name] = value || "";
    }

    // 新加入属性
    if (value) {
      dom.setAttribute(name, value);     // setAttribute不会更新css值, 只适合加入新属性, 因此上面才需要单独把css进行处理
    } else {
      dom.removeAttribute(name); // 如果属性值为空, 表示要删除该属性
    }
  }

}

export default setAttribute