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

第四章 commit阶段
1. 流程概览
2. before mutation阶段
3. mutation阶段
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
