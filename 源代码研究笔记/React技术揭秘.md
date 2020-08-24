文章来源 https://react.iamkasong.com/

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
Q: 送佛送到西，那么源代码里到底是怎么区分useEffect和useLayoutEffect呢？
A: 首先useEffect和useLayoutEffect都会给fiber节点的effectTag属性赋值(前者是UpdateEffect | PassiveEffect，后者是UpdateEffect)
其次将创建个effect对象，保存相关参数，存放在fiber节点的updateQueue(前者effect对象的tag属性HookHasEffect | HookPassive, 后者HookHasEffect | HookLayout)
基于如上区别，就可以在流程中区别了
commitBeforeMutationEffects函数里，所有functionComponent根据effectTag是否带Passive来判断是否要执行异步调度flushPassiveEffects 对应useEffect
commitMutationEffects函数里，effectTag是否带Update，都进入commitWork函数内，如果是functionComponent，则进入commitHookEffectListUnmount，检查fiber的updateQueue，根据effect.tag & (HookLayout | HookHasEffect) 来执行useLayoutEffect的销毁操作 对应 useLayoutEffect的销毁
commitLayoutEffects函数里,根据effectTag & (Update | Callback)的条件，来判定是否进入commitLayoutEffectOnFiber->commitHookEffectListMount 对应 useLayoutEffect的销毁
4. layout阶段
在这阶段主要做的事情
1). commitLayoutEffectOnFiber（调用生命周期钩子和 hook）
2). commitAttachRef（赋值 ref）

实现篇
第五章 Diff算法
1. 概览
为了降低算法复杂度，React的diff会预设三个限制
1). 只对同级元素进行Diff。如果一个DOM节点在前后两次更新中跨越了层级，那么React不会尝试复用它。
2). 两个不同类型的元素会产生出不同的树。比如元素由div变为p，React会销毁div及其子孙节点，并新建p及其子孙节点。
3). 开发者可以通过 key prop来暗示哪些子元素在不同的渲染下能保持稳定
2. 单节点Diff
具体逻辑在reconcileSingleElement里
根据我的理解，workInProgress父Fiber下如果只有一个child（换句话也就是children只有一个），那么diff算法就走单节点Diff逻辑
此时，current树里能对应的fiber要么没有，要么一个到多个
没有的话，很显然，只能新生成一个Fiber并返回
一个到多个的话，会逐个判断key是否相同，再判断type是否相同，都相同时才能复用
这里可以注意到，如果key相同，但是type不相同，也无需往下判断了，因为唯一的可能性都不行，更别说其他的了
3. 多节点Diff
具体逻辑在reconcileChildrenArray函数里
多节点Diff的目的是需要在保留共同基础上确定会有哪些diff
所以我们首先需要确定多节点Diff的场景，一般有三种情况
情况1：节点更新 （节点属性变化 节点类型更新）
情况2：节点新增或减少 （新增节点 减少节点）
情况3：节点位置变化 （位置上移 下移）
这里React团队给出的解决方案是整体逻辑会经历两轮遍历。第一轮遍历处理更新的节点，第二轮遍历处理剩下不属于更新的节点
1). 第一轮遍历处理更新的节点是因为React团队研究发现，日常开发，更新发生的频率更高，因此会优先判断当前节点是否属于更新
细节1: 更准确得说是也涵盖了关于能否重用的判断逻辑
细节2: 判定逻辑详见函数updateSlot( returnFiber, oldFiber, newChild, lanes,)
这里会对比(旧fiber 和 新jsx生成对象)key是否一致，如果一致，会考虑是重用老fiber还是新建Fiber(修改)，不一致的话，此轮遍历就到此结束
细节3: 这里react团队还会检测oldFiber.index > newIdx(newFiber的index)，按照react技术揭秘同一作者的react-on-the-way里同一段的注释，这里考虑到的是oldFiber的前一个兄弟fiber为null的场景，比如[null, a]
细节4: 如果满足oldFiber && newFiber.alternate === null，则执行deleteChild(returnFiber, oldFiber)
显然只有修改的情况下，才会执行。值得一提的是，deleteChild函数里还额外将老fiber标上Deletion，挂载于returnFiber的effect list上。这是因为returnFiber下只有重用或者新增的fiber，没有删除的fiber，需要手动处理。当然其他effectTag就会在后续流程统一从叶到根收集上去
细节5: lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
这里在第一轮里基本只是记录lastPlacedIndex，表明目前第一轮遍历里目前遍历到的可重用fiber的序号，后续第二轮会用到
在第一轮结束后，这里还会判断旧节点或新节点是否遍历完。如果满足这两个条件之一，则不再执行第二轮遍历并返回
旧节点遍历完，新节点没遍历完 说明有新节点，此时遍历剩下的新节点，依次标记Placement
旧节点没遍历完，新节点遍历完 说明少了节点，此时遍历剩下的旧节点，依次标记Deletion
2). 第二轮遍历处理剩下不属于更新的节点
再次明确下第二轮遍历我们要解决的是能解决节点上移或者下移的情况，比如abcd->bcda
为了解决此问题，react提出来的办法其实很简单暴力的
核心思路是，逐一循环剩下的新节点，只需要保证对应的旧节点位置能不动就不动，除非旧节点从前面移动到后面，那只能执行Delete再Placement的操作了
比如abcd(旧)->bcda(新)，可以看到新节点b,c,d，对应旧节点列表的b,c,d，顺序其实都是没变的，所以我们要做的只有将删除a，再添加到末尾
比如abcd(旧)->dabc(新)，可以看到新节点d，对应旧节点列表的d，保持顺序没变，但剩下的a,b,c都只能逐一删除以及添加到末尾
具体实现思路，请参见lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)这一行


第六章 状态更新
1. 流程概览
状态更新的整个调用路径的关键节点
触发状态更新（根据场景调用不同方法）-> 创建Update对象-> 从fiber到root（`markUpdateLaneFromFiberToRoot`）-> 调度更新（`ensureRootIsScheduled`）-> render阶段（`performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`）-> commit阶段（`commitRoot`）
2. 心智模型
按照作者的意思，在React中，所有通过ReactDOM.render创建的应用都是同步更新状态，没有优先级概念
通过ReactDOM.createBlockingRoot和ReactDOM.createRoot创建的应用会采用并发的方式更新状态，优先完成高优更新
3. Update
首先我们可以通过如下方式来触发更新
ReactDOM.render —— HostRoot
this.setState —— ClassComponent
this.forceUpdate —— ClassComponent
useState —— FunctionComponent
useReducer —— FunctionComponent
其中ClassComponent与HostRoot共用一套Update结构，FunctionComponent单独使用一种Update结构
1). update的结构如下
eventTime, // 任务时间，通过performance.now()获取的毫秒数
lane, // 优先级相关
suspenseConfig, // suspense相关
tag: UpdateState, // 更新的类型，包括UpdateState | ReplaceState | ForceUpdate | CaptureUpdate
payload: null, // 更新挂载的数据，不同类型组件挂载的数据不同。对于ClassComponent，payload为this.setState的第一个传参。对于HostRoot，payload为ReactDOM.render的第一个传参
callback: null, // 更新的回调函数，根据作者说法会在commit阶段的layout阶段下调用。TODO：后续有时间研究下具体是怎么调用的
next: null, // 与其他Update连接形成链表
2). Fiber节点上的多个Update会组成链表并被包含在fiber.updateQueue中
updateQueue有三种类型，其中针对HostComponent的请参见completeWork一节
ClassComponent与HostRoot使用的UpdateQueue结构如下
baseState: fiber.memoizedState, // 本次更新前该Fiber节点的state，Update基于该state计算更新后的state
firstBaseUpdate: null, // 本次更新前该Fiber节点已保存的Update，之所以在更新产生前该Fiber节点内就存在Update，是由于某些Update优先级较低所以在上次render阶段由Update计算state时被跳过。
lastBaseUpdate: null,
shared: {
  pending: null, // 触发更新时，产生的Update会保存在shared.pending中形成单向环状链表。当由Update计算state时这个环会被剪开并连接在lastBaseUpdate后面
},
effects: null, // 数组。保存update.calback !== null的Update
3). 关于updateQueue，作者给出了流程如下
假设有一个fiber刚经历commit阶段完成渲染，该fiber的baseUpdate属性上有两个update（由于优先级过低，在上次render阶段并没有处理），这里假设分别为u1，u2
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
u1.next === u2;
现在在fiber上触发两次状态更新，这会产生两个新update，分别为u3 和 u4
fiber.updateQueue.shared.pending === u3;
u3.next === u4;
u4.next === u3;
更新调度完进入render阶段
shared.pending的环被剪开并连接在updateQueue.lastBaseUpdate后面
fiber.updateQueue.baseUpdate: u1 --> u2 --> u3 --> u4
接下来遍历updateQueue.baseUpdate链表，以fiber.updateQueue.baseState为初始state，依次与遍历到的每个Update计算并产生新的state
在遍历时如果有优先级低的Update会被跳过
当遍历完成后获得的state，就是该Fiber节点在本次更新的state
也正是state的不同，以至于在render阶段产生与上次更新不同的JSX对象，通过Diff算法产生effectTag，在commit阶段渲染在页面上
4. 深入理解优先级
这里我们需要参考两部分
1). ReactUpdateQueue.old.js的开头注释部分(参见ReactUpdateQueue注释大意.md)
2). ReactUpdateQueue.old.js的processUpdateQueue函数
可以通过此函数来看看react团队是如何处理跳过某些update的
细节1：当只要有跳过的update时，包括这个update在内，后续的update都会被复制再拼接在baseupdate之后，显然是要等后续低优先级渲染再执行一遍
细节1: newState 和 newBaseState看起来相似，其实各有用意
newState 对应的是 执行所有高优先级update后的state
newBaseState 对应的是 跳过低优先级update前的state
前者会作为workInProgress的memoizedState
后者则保存为queue的baseState，下次渲染还是要基于这个来执行update(参见细节1)，这样就不会担心由于优先级不同，导致结果不同，任你千变万化，最终结果还是根据全都老老实实执行一遍来
5. ReactDOM.render
至此，更新的整个流程都串联起来了
创建fiberRootNode、rootFiber、updateQueue（`legacyCreateRootFromDOMContainer`）
创建Update对象（`updateContainer`）
从fiber到root（`markUpdateLaneFromFiberToRoot`）
调度更新（`ensureRootIsScheduled`）
render阶段（`performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`）
commit阶段（`commitRoot`）
react支持的几个模式
legacy -- ReactDOM.render(<App />, rootNode)
blocking -- ReactDOM.createBlockingRoot(rootNode).render(<App />)
concurrent -- ReactDOM.createRoot(rootNode).render(<App />)
6. this.setState
相关代码请参见enqueueSetState，可以看到update的创建和调度
this.forceUpdate也类似，具体请参见enqueueForceUpdate，区别在于update.tag = ForceUpdate;以及没有payload

第七章 Hooks
1. Hooks理念
最佳参考是https://zh-hans.reactjs.org/docs/hooks-intro.html
相比于ClassComponent，Hooks则更贴近React内部运行的各种概念（state | context | life-cycle）
而且ClassComponent的生命周期概念与Hooks概念本质上是有所区分，不能简单类比
总结: Concurrent Mode是React未来的发展方向，而Hooks是能够最大限度发挥Concurrent Mode潜力的Component构建方式
2. 极简Hooks实现
请参见demo/example3 是作者给出的例子
3. Hooks数据结构
dispatcher
在真实的Hooks中，组件mount时的hook与update时的hook来源于不同的对象，请参见HooksDispatcherOnMount 和 HooksDispatcherOnUpdate
细节1: renderWithHooks里执行完let children = Component(props, secondArg)之后，此时ReactCurrentDispatcher.current = ContextOnlyDispatcher;如此一来useEffect(() => {useState(0);})嵌套写法就会报错
hook数据结构如下
memoizedState
baseState
baseQueue
queue
next
不同类型hook的memoizedState保存不同类型数据，具体如下
useState：对于const [state, updateState] = useState(initialState)，memoizedState保存state的值
useReducer：对于const [state, dispatch] = useReducer(reducer, {});，memoizedState保存state的值
useEffect：memoizedState保存包含useEffect回调函数、依赖项等的链表数据结构effect，effect的创建过程参见pushEffect函数。effect链表同时会保存在fiber.updateQueue中
useRef：对于useRef(1)，memoizedState保存{current: 1}
useMemo：对于useMemo(callback, [depA])，memoizedState保存[callback(), depA]
useCallback：对于useCallback(callback, [depA])，memoizedState保存[callback, depA]。与useMemo的区别是，useCallback保存的是callback函数本身，而useMemo保存的是callback函数的执行结果
有些hook是没有memoizedState的，比如：
useContext
4. useState与useReducer
5. useEffect
6. useRef
7. useMemo与useCallback
