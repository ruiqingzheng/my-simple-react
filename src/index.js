import ReactDOM from './react-dom';
import React from "./react";

// 测试1
// function Welcome( props ) {
//   return <h1>Hello, {props.name}</h1>;
// }
// const element = <Welcome name="Sara" />;


// 测试2 嵌套的组件
class Welcome2 extends React.Component {
  render() {
    return <h1>this is welcome 2, {this.props.name}</h1>
  }
}

class Welcome extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}</h1>
        <p>
          <Welcome2 name="jerry"/>
        </p>
      </div>
    );
  }
}

// 测试3 , 生命周期
class Counter extends React.Component {
  constructor(props) {
    super(props); // 调用基类的构造方法初始化props
    this.state = {
      num: 0,
    }
  }

  componentWillUpdate() {
    console.log(`componentWillUpdate`);
  }

  componentDidUpdate() {
    console.log(`componentDidUpdate`);
  }

  componentWillMount() {
    console.log("componentWillMount");
  }

  componentDidMount() {
    console.log("componentDidMount");
  }


  clicked() {
    console.log(`render clicked, old state num: ${this.state.num}`);
    this.setState( { num: this.state.num + 1 });
    console.log(`updated state num: ${this.state.num}`);
  }

  render() {
    return (
      <div onClick={ () => this.clicked() }>
        <h1>number: {this.state.num}</h1>
        <button><span style="color: red">add</span></button>
      </div>
    );
  }
}

ReactDOM.render(
  <div>
    <Welcome name="hendry"/>
    <Counter/>
  </div>
  ,
  document.getElementById('root')
);
