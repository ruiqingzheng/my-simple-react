// import {render, renderComponent} from './render.js'
import {diff} from './diff-render.js';

function render(vnode, container, dom) {
  diff(dom, vnode, container);
}

export default {
  render
}

