理念篇
第一章 React理念
1. React理念
官网理念：React 是用 JavaScript 构建快速响应的大型 Web 应用程序的首选方式  
从两个角度来看待
1). 速度快
由于模板相比起vue更为灵活，因此需要在运行时花更多努力优化
比如 PureComponent 或 React.memo构建组件，生命周期钩子shouldComponentUpdate，渲染列表时使用key，使用useCallback 和 useMemo缓存函数和变量
2). 响应自然
将同步的更新变为可中断的异步更新。因此才会有react15到16，甚至17的重构
2. 老的React架构
3. 新的React架构
在15的Reconciler以及Renderer上，16新增了个Scheduler
4. Fiber架构的心智模型
代数效应: 函数式编程 中的概念，用于将副作用从函数调用中分离。
我理解下来 作者意思是同步写法更有利于减轻心智负担，就算真的涉及到异步，也能根据框架本身设计来尽力避免。
比如hooks，或者更明显的Suspense Demo[https://codesandbox.io/s/frosty-hermann-bztrp]，可以看到官方是如何提供避免异步的问题。
实现代数效应，react团队是由考虑过Generator的，然而没采用。他们给出的理由是中间状态是上下文关联，然后本身使用也有心智负担
5. Fiber架构的实现原理
fiber节点静态数据结构
tag: Fiber对应组件的类型 Function/Class/Host...
type: 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
elementType: 大部分情况同type，某些情况不同，比如FunctionComponent使用React.memo包裹
stateNode: Fiber对应的真实DOM节点
6. Fiber架构的工作原理
7. 总结
Reconciler工作的阶段被称为render阶段。因为在该阶段会调用组件的render方法。
Renderer工作的阶段被称为commit阶段。commit阶段会把render阶段提交的信息渲染在页面上。
render与commit阶段统称为work，即React在工作中。相对应的，如果任务正在Scheduler内调度，就不属于work。

第二章 前置知识
1. 源码的文件结构
2. 调试源码
3. 深入理解JSX

架构篇
第三章 render阶段
1. 流程概览
2. beginWork
3. completeWork
这里在update时，在updateHostComponent内部，被处理完的props会被赋值给workInProgress.updateQueue，并最终会在commit阶段被渲染在页面上。updatePayload为数组形式，他的奇数索引的值为变化的prop key，偶数索引的值为变化的prop value

第四章 commit阶段
1. 流程概览
作者在这里先 简单介绍 “before mutation阶段”之前 和 “layout阶段”之后的额外工作
这里涉及到了useLayoutEffect和useEffect的区别
参考资料https://www.cnblogs.com/iheyunfei/p/13065047.html
2. before mutation阶段
在这阶段主要做的事情
1). 处理DOM节点渲染/删除后的 autoFocus、blur 逻辑。
2). 调用getSnapshotBeforeUpdate生命周期钩子。
3). 调度useEffect。
Q: 为什么从v16开始，componentWillXXX钩子前增加了UNSAFE_前缀？
A: Stack Reconciler重构为Fiber Reconciler后，render阶段的任务可能中断/重新开始，对应的组件在render阶段的生命周期钩子（即componentWillXXX）可能触发多次。为此React提供了替代的生命周期钩子getSnapshotBeforeUpdate。按照作者的的说法，getSnapshotBeforeUpdate是在commit阶段内的before mutation阶段调用的，由于commit阶段是同步的，所以不会遇到多次调用的问题
Q: useEffect是如何调度的？
A: 通过scheduleCallback来异步调度。分为三步如下走
1). before mutation阶段在scheduleCallback中调度flushPassiveEffects
2). layout阶段之后将effectList赋值给rootWithPendingPassiveEffects
3). scheduleCallback触发flushPassiveEffects，flushPassiveEffects内部遍历rootWithPendingPassiveEffects
Q: 为什么useEffect要异步调用？
A: 能让浏览器先完成布局与绘制，这样就适用于许多常见的副作用场景，比如设置订阅和事件处理等情况，因此不应在函数中执行阻塞浏览器更新屏幕的操作。
Q: useLayoutEffect又是怎么处理的呢？
A: useLayoutEffect是同步调用，因此调用时，浏览器还未完成布局与绘制。也正是如此，表现与componentDidMount，componentDidUpdate一致，都会堵塞浏览器渲染
3. mutation阶段
在这阶段主要做的事情
1). 根据ContentReset effectTag重置文字节点
2). 更新ref
3). 根据effectTag分别处理，其中effectTag包括(Placement | Update | Deletion | Hydrating)
这里值得一提的是Update里也涉及到了useLayoutEffect的销毁函数，而且也是同步调用
当然也会处理fiber节点的updateQueue(请参见render阶段)
4. layout阶段

实现篇
第五章 Diff算法
1. 概览
2. 单节点Diff
3. 多节点Diff

第六章 状态更新
1. 流程概览
2. 心智模型
3. Update
4. 深入理解优先级
5. ReactDOM.render
6. this.setState

第七章 Hooks
1. Hooks理念
2. 极简Hooks实现
3. Hooks数据结构
4. useState与useReducer
