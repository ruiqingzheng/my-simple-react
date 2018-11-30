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
      num: 11,
    }
  }

  componentWillUpdate() {
    console.log("update");
  }

  componentWillMount() {
    console.log("mount");
  }

  // onClick() {
  //   console.log("click");
  //   this.setState( { num: this.state.num + 1 } );
  // }
  clicked() {
    console.log("clicked");
  }


  render() {
    // function onClick() {
    //   console.log("click");
    //   this.setState( { num: this.state.num + 1 } );
    // }
    function clicked() {
      console.log("render clicked");
    }

    return (
      <div onClick={ this.clicked }>
        <h1>number: {this.state.num}</h1>
        <button>add</button>
      </div>
    );
  }

  // render() {
  //   return (
  //     <div onClick={() => self.onClick()}>
  //       <h1>counter: {self.state.num}</h1>
  //       <button >add</button>
  //     </div>
  //   );
  // }
}

ReactDOM.render(
  <div>
    <Welcome name="hendry"/>
    <Counter/>
  </div>
  ,
  document.getElementById('root')
);
