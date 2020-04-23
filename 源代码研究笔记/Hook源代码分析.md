let renderExpirationTime: ExpirationTime = NoWork;
let currentlyRenderingFiber: Fiber | null = null; // 目前正在渲染的Fiber

let currentHook: Hook | null = null;
let nextCurrentHook: Hook | null = null;
let firstWorkInProgressHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
let nextWorkInProgressHook: Hook | null = null;
let remainingExpirationTime: ExpirationTime = NoWork;
let componentUpdateQueue: FunctionComponentUpdateQueue | null = null;
let sideEffectTag: SideEffectTag = 0;


首先先看看初始加载的函数栈
beginWork -> mountIndeterminateComponent
-> value = renderWithHooks(null, workInProgress, Component, props, context, renderExpirationTime,);

renderWithHooks(current, workInProgress, Component, props, refOrContext, nextRenderExpirationTime,)
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;
  nextCurrentHook = current !== null ? current.memoizedState : null;
  ReactCurrentDispatcher.current =
      nextCurrentHook === null
        ? HooksDispatcherOnMount // 初始化加载专用
        : HooksDispatcherOnUpdate; // 更新时专用
  let children = Component(props, refOrContext); // 此时可能用到hook的useState
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  const renderedWork: Fiber = (currentlyRenderingFiber: any);
  renderedWork.memoizedState = firstWorkInProgressHook;
  renderedWork.expirationTime = remainingExpirationTime;
  renderedWork.updateQueue = (componentUpdateQueue: any);
  renderedWork.effectTag |= sideEffectTag;
  const didRenderTooFewHooks =
  currentHook !== null && currentHook.next !== null;
  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;
  currentHook = null;
  nextCurrentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  nextWorkInProgressHook = null;
  remainingExpirationTime = NoWork;
  componentUpdateQueue = null;
  sideEffectTag = 0;



  

HooksDispatcherOnMount{
  useState: mountState
}

mountState(initialState)
  const hook = mountWorkInProgressHook();
    -> mountWorkInProgressHook()
      const hook: Hook = {
        memoizedState: null,  // 目前值
        baseState: null,      // 初始值
        queue: null,          // 队列
        baseUpdate: null,     
        next: null,
      };
      if (workInProgressHook === null) {
        firstWorkInProgressHook = workInProgressHook = hook;
      } else {
        workInProgressHook = workInProgressHook.next = hook;
      }
      return workInProgressHook;
  if (typeof initialState === 'function') { initialState = initialState();}
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    last: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch = (queue.dispatch = (dispatchAction.bind( null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];

// 相当于this.setState 正式触发改动
dispatchAction(fiber, queue, action)
  首先检查numberOfReRenders < RE_RENDER_LIMIT，如果rerender次数过多，则报错
  const alternate = fiber.alternate;
  if ( fiber === currentlyRenderingFiber || (alternate !== null && alternate === currentlyRenderingFiber)){
    // 看上去可能是父节点更新导致此节点
    //TODO 纯属猜测，先跳过暂且不看
  }else{
    重新计算出expirationTime
    const update = {
      expirationTime,
      suspenseConfig,
      action,
      eagerReducer: null,
      eagerState: null,
      next: null,
    };
    const last = queue.last;
    将update给添加到queue的末尾，看起来queue本身就是一个圆环链表，只是queue.last指向尾端 //TODO 我还是不明白这里搞圆环的意义何在
    if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
      // 猜测这里是作者想判断节点是否进入render phase状态
      // 总之会对比state 和 更改后的state
      const lastRenderedReducer = queue.lastRenderedReducer;
      const currentState = queue.lastRenderedState;
      const eagerState = lastRenderedReducer(currentState, action);
      update的eagerReducer 和 eagerState也同步下
      is(eagerState, currentState)直接return
    }
    scheduleWork(fiber, expirationTime);
  }






https://www.jianshu.com/p/0e7c195d6b7d
https://copyfuture.com/blogs-details/202001201553149693zwp1d737suwaea
https://www.xingmal.com/article/article/1239165188612165632
https://codertw.com/%E7%A8%8B%E5%BC%8F%E8%AA%9E%E8%A8%80/712641/

