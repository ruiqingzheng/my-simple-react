import {renderComponent} from '../react-dom/diff-render.js';

class Component {
  constructor(props = {}) {
    this.state = {};
    this.props = props;
  }

  // 更新state后立即重新渲染
  setState(stateChange) {
    // 如果需要old state 那么可以在这里获取和传参
    // this.state = Object.assign({},this.state, stateChange);
    Object.assign( this.state, stateChange );
    renderComponent(this);
  }
}

export default Component;