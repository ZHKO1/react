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
        baseUpdate: null,     // 
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
  }else{

  }








