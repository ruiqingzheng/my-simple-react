# 从零开始实现一个React（三）：diff算法

原文:

`https://segmentfault.com/a/1190000014307795`

`https://github.com/hujiulong/blog/issues/6`

## diff 算法和流程

在组件和生命周期的实现中

`函数组件`和`类组件`还有`嵌套组件`, 最终都是统一成`组件`进行渲染, 流程都是一样的

`createComponent` -> `setComponentProps` -> `renderComponent` -> `_render`

并且在 `renderComponent` 方法中, 我们把组件的渲染结果, 保存起来了, 也就是组件对象的basedom属性(原文是base属性)

```js
  component.basedom = basedom;    // 设置component对象的basedom属性为真实dom
  basedom._component = component; // 设置真实dom的_component属性为component对象
```

我们所有的组件的渲染都是通过`renderComponent`方法来完成的, 在上一节组件和生命周期的实现中, 判断标志位basedom存在, 那么当前渲染操作就是更新

但前面的更新操作 是把这个组件整个的重新渲染, 直接重新调用`_render`方法  , 但实际上数据变化后, 往往只是组件内部局部UI需要更新, 而不是整个组件更新.

我们现在要做的`diff`算法, 就是在`渲染组件`的时候, 判断该组件即将渲染的`虚拟dom`(也就是组件render方法返回的jsx)和它已有的`真实dom`(basedom), 之间有什么区别

并且在比较的时候, 更新该组件.

另外还有一个需要注意的是, 我们的`真实dom`对象保存了一份渲染时候的当时的vnode `_component`

所以我们实际比较的是即将渲染的`vnode` 和 该组件已经渲染了的`vnode` , 也就是该组件的(`basedom._component属性`)

流程:

`renderComponent (实现生命周期, 且调用diffNode)`  --> `diffNode()`

`diffNode` 方法中判断`vnode`的标签, 如果标签是函数(`函数定义的组件, 或者是嵌套组件`), 

// diffNode

```js

    if ( typeof vnode.tag === 'function' ) {
        return diffComponent( dom, vnode );
    }

```

// `diffComponent`

那么就需要判断该是不是已经渲染过且标签是否相同, 相同就说明组件类型没有变化, 那么就重新set props   `setComponentProps( c, vnode.attrs );`

```js
    // 如果组件类型没有变化，则重新set props
    if ( c && c.constructor === vnode.tag ) {
        setComponentProps( c, vnode.attrs );
        dom = c.base;
    }
```

// 如果组件类型变化，则移除掉原来组件，并渲染新的组件

```js
        c = createComponent( vnode.tag, vnode.attrs );

        setComponentProps( c, vnode.attrs );
        dom = c.base;

        if ( oldDom && dom !== oldDom ) {
            oldDom._component = null;
            removeNode( oldDom );
        }
```

`diffNode` 是我们的`diff`算法核心了  `参数1`是该组件已有的`真实dom`,  `参数2`是即将渲染的`虚拟dom` ;

比较的顺序, 也是和渲染的顺序类似, 通过遍历判断vnode的标签

- 如果vnode标签是文本节点, 且当前dom标签页是文本节点, 则直接更新内容，否则就新建一个文本节点，并移除掉原来的DOM。
  
- 如果vnode标签是`function` , 调用`diffComponent( dom, vnode )` 方法,

    // 如果该组件类型, 没有变化，那么就更新参数`diffNode` -> `diffComponent`  -> `setComponentProps` -> `renderComponent` ->　`diffNode`
    // 如果组件类型变化，则移除掉原来组件，并渲染新的组件

## 流程图

![diff算法流程图](http://pj5gsyabp.bkt.clouddn.com/diff%E7%AE%97%E6%B3%95%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

## 子节点的渲染

情况一: 当第一次渲染子节点时

`ReactDOM.render(JSX, document.getElementById('root'))`

```js
function render(vnode, container, dom) {
  diff(dom, vnode, container);
}
```

入口render传递给diff的`dom`是`undefined` , vnode 是JSX解析后的虚拟dom对象,  `container`是`id`为`root`的`dom元素`

`diff` 调用--> `diffNode(dom, vnode)`

// 继续执行 `diffNode` , 传递过来的`dom`是`undefined` , 说明是首次渲染, 则创建`vnode.tag`, 第一次运行时这里创建的就是`JSX`中的根节点元素

```js
  // 如果dom不存在说明是第一次渲染, 如果是不同类型那么也需要重新渲染
  if (!dom || !isSameNodeType(dom, vnode)) {
    out = document.createElement(vnode.tag);

```

// 继续执行 `diffNode` ,开始渲染子节点,  因为这里还是首次渲染, 此时传递给`diffChildren`方法时, `out`就是刚刚创建的节点, 它没有任何子节点, `diffChildren`将会完成渲染子节点工作

// `diffNode` 调用--> `diffChildren(out, vnode.children);`

```js
  if (vnode.children && vnode.children.length > 0 || ( out.childNodes && out.childNodes.length > 0 )) {
    diffChildren(out, vnode.children);
  }
```

// 执行`diffChildren`方法,   参数`dom` 节点下面没有子节点,  而`diffChildren`方法主要需要完成的是把已经渲染的`dom下的子节点`和将要渲染的虚拟dom下的children进行对比,

所以`diffChildren`方法中大量的代码都是在找`vchild`所对应的已经渲染的子节点

vchild -- 待渲染的子节点, 也就是vnode.children数组元素
child -- 渲染的dom下的子节点

最终确定对应关系后, 再次执行diffNode方法

`child = diffNode(child, vchild);`

而因为是首次渲染子节点, 所以实际上此时`child` 是`undefined` , 于是又执行到`diffNode`方法中判断`dom`不存在, 于是创建该子节点, 且递归地创建该子节点下面的子节点

```js
  // 如果dom不存在说明是第一次渲染, 如果是不同类型那么也需要重新渲染
  if (!dom || !isSameNodeType(dom, vnode)) {
    out = document.createElement(vnode.tag);
    .....
  }

  if (vnode.children && vnode.children.length > 0 || ( out.childNodes && out.childNodes.length > 0 )) {
    diffChildren(out, vnode.children);
  }
  ...

  return out
```

但最终返回创建好的`child`节点, 回到`diffChildren`的赋值语句,继续执行,

将创建好的子节点`child`, 挂载到`diffChildren`的第一个`参数dom`上, 如果`dom`下没有该子节点, 那么直接添加,

如果已经有其他节点了, 那么则用`insertBefore`插入

如果child和当前位置子节点的兄弟节点一样, 那么删除当前节点

```js
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
```

情况二: 更新对比渲染子节点

当dom渲染完毕,  `diffChildren(out, vnode.children);` 执行中, `out` 也就是真实`dom` 的`childNodes`不为空, 则需确定当前待渲染的vchild具体对应哪个childNode,原文讲的比较清楚了

找到后再执行 `child = diffNode(child, vchild);` 获得更新的child , 放到当前vchild的对应位置

## FAQ

### Element.attributes  

返回该dom元素所有属性

https://developer.mozilla.org/zh-CN/docs/Web/API/Element/attributes

```JS
var paragraph= document.getElementById("paragraph");
var attrs = paragraph.attributes;
for(var i=attrs.length-1; i>=0; i--) {
         output+= attrs[i].name + "->" + attrs[i].value;
}
```

### 函数组件扩展为类组件

比如需要返回的是Component对象 , 将原来的函数作为该对象的render方法,

为了不改变该对象的constructor属性 ,  于是修改 `inst.constructor = Welcome`

修改render属性

```js
inst.render = function() {
  return this.constructor(props);
}
```

// 这里也可以用  inst.render = Welcome
// 效果是一样的, 但是用function包起来返回constructor的调用,
// 可以确保的确修改了inst的constructor

```js
function Welcome(username) {
  return (<div>
    <h2>hello, {username}!</h2>
  </div>)
}

class Component {
  constructor(props) {
    this.props = props;
  }
}

let inst = new Component(props)
inst.constructor = Welcome
// 这里也可以用  inst.render = Welcome
// 效果是一样的, 但是用function包起来返回constructor的调用,
// 可以确保的确修改了inst的constructor

inst.render = function() {
  return this.constructor(props);
}

```