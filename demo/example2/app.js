'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var {useState, useLayoutEffect} = React;


function Damn(){
  const [state, setstate] = useState(0);
  const onChange = ()=>{
    setstate(state + 1);
  }
  useLayoutEffect(()=>{
    debugger;
    document.title = state
  }, [state])

  return (<div><button onClick={onChange}>add</button>{state}</div>)
}
ReactDOM.render(<Damn />, document.getElementById('container'));
