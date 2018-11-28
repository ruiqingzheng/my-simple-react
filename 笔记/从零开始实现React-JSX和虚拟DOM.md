# 从零开始实现一个React（一）：JSX和虚拟DOM

原文

`https://github.com/hujiulong/blog/issues/4`

## jsx是语法糖

```js
const title = <h1 className="title">Hello, world!</h1>;
```

上面的`jsx`代码会被babel转换成如下代码

```js
const title = React.createElement(
    'h1',
    { className: 'title' },
    'Hello, world!'
);
```

测试环境:

`parcel-bundler` 是调试web服务器, 能`hot-reload`自动热加载 , `npm install -g parcel-bundler`

启动parcelweb服务器调试: `parcel index.html`

创建基本的app目录结构: 新建`src/index.js`和`index.html`，在`index.html`中引入`index.js` 就像使用react

## 使用`babel-plugin-transform-react-jsx` 来解析jsx为虚拟DOM

依赖:`babel-plugin-transform-react-jsx`

`npm install -D babel-plugin-transform-react-jsx`

常规编译es6方法可以使用intellij的watcher来编译es6 `https://oomusou.io/webstorm/es6-file-watcher/`

`settings->file watcher->添加 babel` 那么会自动按目录结构编译输出到dist目录.

而在用`parcel`后, 我们项目添加了依赖`babel-plugin-transform-react-jsx`,

然后我们只需要配置好`.babelrc` , 其他相关的依赖parcel会自动帮我们添加进来, 而且es6自动编译es5

启动运行`parcel ./index.html` 然后打开页面`http://localhost:1234/`

```json
{
    "presets": ["env"],
    "plugins": [
        ["transform-react-jsx", {
            "pragma": "React.createElement"
        }]
    ]
}
```

// 解析虚拟DOM测试

```js

// 对createElement的实现非常简单，只需要返回一个对象来保存它的信息就行了。
function createElement(tag,attrs, ... children) {
  console.log("running createElement");
  return {
    tag,
    attrs,
    children
  }
}
// 将上文定义的createElement方法放到对象React中
const React = {
  createElement
}

const element = (
  <div>
    hello<span>world!</span>
  </div>
)

console.log(element);
```

改名后也能正常运行, 只要babelrc中设置的解析和我们定义的方法一致即可运行, 比如吧createElement改名为createVDOM , 把React类名改为`Ret`

bablerc对应修改后, 也能输出vdom

```js
    ["transform-react-jsx", {
      "pragma": "Ret.createVDOM"
    }]
```

## ReactDOM.render

接下来是ReactDOM.render方法，我们再来看这段代码

```js
ReactDOM.render(
    <h1>Hello, world!</h1>,
    document.getElementById('root')
);
```

经过转换，这段代码变成了这样

```js
ReactDOM.render(
    React.createElement( 'h1', null, 'Hello, world!' ),
    document.getElementById('root')
);
```

所以render的第一个参数实际上接受的是createElement返回的对象，也就是虚拟DOM
而第二个参数则是挂载的目标DOM

### 设置dom属性

js读写dom属性, 就像读写类的属性类似, 可以用`.`, 也可以用`下标`

比如

```js
    var img = docuemnt.getElementById('img');
    // 访问id属性
    var img_id = img.id
    // 访问src属性
    var img_url = img['src']
```

而VDOM 对象的atts是已经解析好了的属性键值对, 但键名和dom属性的键名, 略有不同,

1. css样式 `class`在js里面是`保留词`, 于是在jsx里面用的是`className`

2. dom中定义事件处理`onclick="handleClick"` , jsx里面是`onClick={handleClick}`

于是我们根据这些规则, 来设置相应的dom属性

```js
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
```

## FAQ

在定义React组件或者书写React相关代码，不管代码中有没有用到React这个对象，我们都必须将其import进来，这是为什么？

```js
import React from 'react';    // 下面的代码没有用到React对象，为什么也要将其import进来
import ReactDOM from 'react-dom';

ReactDOM.render( <App />, document.getElementById( 'editor' ) );
```

answer:

因为`ReactDOM.render`方法的第一个参数, 传递的是`jsx`代码, 这段`jsx`代码会被`transform-react-jsx` 解析为 `React.createElement`调用, 并返回`虚拟DOM`.

实际上接受的是createElement返回的对象，也就是虚拟DOM. 因此jsx解析为虚拟DOM 是需要调用`React.createElement`, 所以必须要引入`react`

### dom属性的设置

// 事件属性的设置

```js
    name = name.toLowerCase();
    dom[name] = value || '';
```

// css字符串样式的设置
dom.style.cssText = value;  //比如 style: "color: red" , 那么直接设置`dom.style.cssText`

// css键值对样式的设置
dom.style[csskey] = typeof value[csskey] == 'number' ? value[csskey] + 'px' : value[csskey];

// 其他属性的添加
`dom.setAttribute()`

https://www.w3schools.com/jsref/met_element_setattribute.asp

// 删除属性 `removeAttribute()`
Use the removeAttribute() method to remove an attribute from an element.