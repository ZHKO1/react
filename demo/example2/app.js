'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var {useState} = React;


function Damn(){
  const [state, setstate] = useState(0);
  const onChange = ()=>{
    setstate(state + 1);
  }
  return (<div><button onClick={onChange}>add</button>{state}</div>)
}
ReactDOM.render(<Damn />, document.getElementById('container'));
