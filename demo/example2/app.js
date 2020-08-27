'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var {useState, useLayoutEffect} = React;


function Damn(){
  const [state, setstate] = useState(0);
  const onChange = ()=> {
    setstate((state) => state + 1);
    setstate((state) => state + 1);
  }
  /*
  useLayoutEffect(()=>{
    debugger;
    document.title = state
  }, [state])
  */

  return (<div><button onClick={onChange}>add</button>{state}</div>)
}




// 观察 useEffect的销毁和创建顺序
function App(){
  var [state, setState] = React.useState(0);
  var ref = React.useRef(0);
  var onClick = function(){
    setState((state)=>(state + 1))
  }
  return (<div>
    <button onClick={onClick}>更改state</button>
    ref {ref.current}
    <Demo1 ref_={ref} state={state}></Demo1>
    <Demo2 ref_={ref} state={state}></Demo2>
  </div>)
}



var Demo1 = ((props) => {
  var ref = props.ref_;

  React.useEffect(function(){
    ref.current = '1-1'
    console.log("1-1");
    return function(){
    }
  });
  return (
    <button>
        1--{props.state}
    </button>
  )
});

var Demo2 = ((props, ref) => {
  var ref = props.ref_;
  React.useEffect(function(){
    return function(){
      ref.current = '2-2'
      console.log("2-2");
    }
  });
  return (
    <button>
      2--{props.state}
    </button>
  )
});


ReactDOM.render(<App />, document.getElementById('container'));
