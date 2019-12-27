**ReactDOM**

ReactFilberClassComponent.js
enqueueSetState
enqueueForceUpdate
上面两个区别是update.tag有所不同，共同点是跟updateContainer有点像。

React.Children.map
两点点: 对象池的概念，对于性能的提升。
function mapChildren(children, func, context)
    const result = [];
    mapIntoWithKeyPrefixInternal(children, result, null, func, context);
    return result;

function mapIntoWithKeyPrefixInternal(children, array[要修改的最终结果], prefix, func, context)
    let escapedPrefix = '';
    if (prefix != null) {
        escapedPrefix = escapeUserProvidedKey(prefix) + '/';
    }
    const traverseContext = getPooledTraverseContext(array, escapedPrefix, func, context,);//从对象池里随便获取一个对象，保存各种参数，提高性能
    traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
    releaseTraverseContext(traverseContext);//将对象给压回对象池，方便下次获取

function traverseAllChildren(children, callback, traverseContext)
    return traverseAllChildrenImpl(children, '', callback, traverseContext);
    跳转到 function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext,)
        先检查children是否是string，number，或者react节点 则直接callback(traverseContext, children, nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,);
        如果不是，那则是数组，依次循环children，traverseAllChildrenImpl(child, nextName, callback, traverseContext,)

function mapSingleChildIntoContext(bookKeeping, child, childKey)
    从bookKeeping(traverseContext)提取出result, keyPrefix, func, context。
    let mappedChild = func.call(context, child, bookKeeping.count++);
    检查mappedChild是否是数组，如果是，则回调mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, c => c);
    如果不是，则视情况替换key，然后push到result内


ReactDOM.render 的大致思路
function render(element, container)
    return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
    跳转 -> function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback)
      root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate) //在原生容器上初始挂载
      fiberRoot = root._internalRoot;
      unbatchedUpdates(() => {
        updateContainer(children, fiberRoot, parentComponent, callback);
      });

function legacyRenderSubtreeIntoContainer(container)
    清除container内部
    返回  createLegacyRoot(container)
        跳转 -> function createLegacyRoot(container, options)
            return new ReactDOMBlockingRoot(container, LegacyRoot, options);

ReactDOMBlockingRoot类
    constructor -> this._internalRoot = createRootImpl(container, tag, options);
    prototype.render
    prototype.unmount

function createRootImpl(container, tag, options)
    const root = createContainer(container, tag, hydrate, hydrationCallbacks);
    markContainerAsRoot(root.current, container);//标记container['__reactContainere$' + randomKey] = root.current; 根据上下文root.current应该是指FiberNode
    return root;

function createContainer(containerInfo, tag, hydrate, hydrationCallbacks)
    return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);

function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks)
    const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
    const uninitializedFiber = createHostRootFiber(tag);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    return root;

function createHostRootFiber(tag: RootTag): Fiber
    return createFiber(HostRoot, null, null, mode);
        跳转 -> function createFiber(tag: WorkTag, pendingProps: mixed, key: null | string, mode: TypeOfMode,): Fiber
            return new FiberNode(tag, pendingProps, key, mode);

FiberNode类属性
stateNode 绑定了FiberRootNode，需要研究下如果是子FilberNode，这里stateNode会绑定什么？Class实例？Dom节点实例？
return 父节点
child 子节点
sibling 兄弟节点
这里需要注意 effectTag属性 和 alternate属性，看看后续会不会用到
pendingProps 新的变动带来的新的props，即nextProps
memoizedProps 上一次渲染完成后的props,即 props
updateQueue 所产生的update，都会放在该队列中
mode 有conCurrentMode和strictMode 用来描述当前Fiber和其他子树的Bitfield
expirationTime 代表任务在未来的哪个时间点 应该被完成
childExpirationTime 快速确定子树中是否有 update


unbatchedUpdates
  executionContext 去除 BatchedContext位，声明 LegacyUnbatchedContext位
  回调 -> updateContainer()
    requestCurrentTimeForUpdate 获取目前的时间(MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0))
    const expirationTime = computeExpirationForFiber(currentTime, current, suspenseConfig)
      // 代码看下来 expirationTime越小，优先级则越低。expirationTime越大，优先级则越高。
      getCurrentPriorityLevel() 来确认 优先级
        Scheduler_getCurrentPriorityLevel()
      根据不同优先级来采用不同计算方式
      case ImmediatePriority:
        expirationTime = Sync;
        break;
      case UserBlockingPriority:
        expirationTime = computeInteractiveExpiration(currentTime);
        break;
      case NormalPriority:
      case LowPriority:
        expirationTime = computeAsyncExpiration(currentTime);
        break;
      case IdlePriority:
        expirationTime = Idle;
        break;
    const update = createUpdate(expirationTime, suspenseConfig); //创建个update对象，值得注意的是对象的tag属性是UpdateState（值为0）
    update.payload = {element};
    enqueueUpdate(current, update); //保存update对象到fiber对象的updateQueue属性里
    scheduleWork(current, expirationTime);


enqueueUpdate的逻辑，我们来看看react是如何将update压入到fiber.updateQueue队列里
我看下来理解的是queue1和queue2有可能是不同对象，但是实质上两个队列最新的update都是一致的。
1. queue1取的是fiber.updateQueue;
   queue2取的是alternate.updateQueue
2. fiber和alternate都不为空的话，则进行后续步骤
 1). 如果两者均为null，则调用createUpdateQueue()获取初始队列；如果两者之一为null，则调用cloneUpdateQueue()从对方中复制来一个新的队列
 2). 此时两者均初始化完毕
  1]. 两者相同 则只需要对其中一个队列操作即可
  2]. 两者不同 如果有一个或者两个队列为空，那么压入update
      如果两个队列都有数据，那么都操作（这里代码对queue1操作，queue2避免多余的操作）
3. alternate为空的话，则只对fiber操作


scheduleUpdateOnFiber(和scheduleWork是同一个函数)
  checkForNestedUpdates 检查内嵌循环
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
    更新fiber.expirationTime, fiber.alternate.expirationTime
    往上更新父节点的childExpirationTime，以及父节点alternate.expirationTime，同时获得了root（FiberRoot节点）
    记录更新root的firstPendingTime
    返回root
  checkForInterruption(fiber, expirationTime);//_DEV_,暂且不用看
  recordScheduleUpdate();//_DEV_,暂且不用看
  const priorityLevel = getCurrentPriorityLevel();
  当流程还处于unbatchedUpdates阶段，未进入rending阶段（RenderContext | CommitContext）{
      schedulePendingInteractions(root, expirationTime);
        scheduleInteractions(root, expirationTime, __interactionsRef.current);//初次加载时，没用到此函数，暂且先不看（光看代码逻辑，似乎是跟踪栈？等后续再看看这玩意儿到底是什么）
      performSyncWorkOnRoot(root);
  }

performSyncWorkOnRoot(root)
  var lastExpiredTime = root.lastExpiredTime;
  var expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;
  if (root.finishedExpirationTime === expirationTime) {
    //以后再看
  } else {
    先检查阶段(RenderContext | CommitContext))
    flushPassiveEffects(); //初次加载也什么都没做
    如果 全局参数workInProgressRoot 和 renderExpirationTime未初始化
      prepareFreshStack(root, expirationTime);
        workInProgressRoot = root;
        workInProgress = createWorkInProgress(root.current, null, expirationTime);// 此函数里获取current.alternate 为 workInProgress，并重新初始化;
        renderExpirationTime = expirationTime;        
      startWorkOnPendingInteractions(root, expirationTime);//初始化似乎没咋鸟用
    executionContext |= RenderContext;
    const prevDispatcher = pushDispatcher(root); //不明觉厉 后续再看这个有个鸟用
    do {
      try {
        workLoopSync();
        break;
      } catch (thrownValue) {
        handleError(root, thrownValue);
      }
    } while (true);
  }


workLoopSync()
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
      跳转 -> performUnitOfWork(unitOfWork)
        const current = unitOfWork.alternate;
        let next;
        next = beginWork(current, unitOfWork, renderExpirationTime);
        unitOfWork.memoizedProps = unitOfWork.pendingProps;
        if (next === null) {
          next = completeUnitOfWork(unitOfWork);
        }
        return next;
  }
  
  
beginWork(current, workInProgress, renderExpirationTime,)
  const updateExpirationTime = workInProgress.expirationTime;
  workInProgress.expirationTime = NoWork;
  根据 workInProgress.tag 进入不同分支
  case HostRoot:
    return updateHostRoot(current, workInProgress, renderExpirationTime);


updateHostRoot(current, workInProgress, renderExpirationTime)
    const updateQueue = workInProgress.updateQueue;
    const nextProps = workInProgress.pendingProps;
    const prevState = workInProgress.memoizedState;
    const prevChildren = prevState !== null ? prevState.element : null;
    processUpdateQueue( workInProgress, updateQueue, nextProps, null, renderExpirationTime, );
      -> processUpdateQueue(workInProgress, queue, props, instance, renderExpirationTime)
        queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue); //如果workInProgress.updateQueue 和 current.updateQueue都是用同一个对象，那么就要复制对象来以便区分
        let newBaseState = queue.baseState;
        let newFirstUpdate = null;
        let newExpirationTime = NoWork;
        let update = queue.firstUpdate;
        let resultState = newBaseState;
        从update开始，根据update = update.next 循环
        resultState = getStateFromUpdate(workInProgress, queue, update, resultState, props, instance,);
         -> getStateFromUpdate(workInProgress, queue, update, prevState, nextProps, instance,)
            根据update.tag来判断
            case UpdateState:const partialState = update.payload;return Object.assign({}, prevState, partialState);//这里payload是对象类型，如果是函数类型，还需要执行下
        queue.baseState = newBaseState;//这里newBaseState还会被resultState给覆盖
        queue.firstUpdate = newFirstUpdate;//如果优先级到了，而且update都合并完了，这里newFirstUpdate会为空。后续研究updateExpirationTime < renderExpirationTime的情况
        queue.firstCapturedUpdate = newFirstCapturedUpdate;
        workInProgress.expirationTime = newExpirationTime;//看起来如果优先级到了，而且update都合并完毕后，newExpirationTime会为空
        workInProgress.memoizedState = resultState;
    const nextState = workInProgress.memoizedState;
    const nextChildren = nextState.element;
    // 判断nextChildren和prevChildren不一致，同时也不是服务器渲染
    reconcileChildren( current, workInProgress, nextChildren, renderExpirationTime,);
    return workInProgress.child;

reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime,)
    if (current === null) {
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime,);
    } else {
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderExpirationTime,);
    }

const reconcileChildFibers = ChildReconciler(true);
const mountChildFibers = ChildReconciler(false);

ChildReconciler(shouldTrackSideEffects)
    deleteChild(returnFiber, childToDelete){
        // 这里我的理解是记录要做出的改动到returnFiber上。
        // 同时childToDelete本身清除nextEffect属性，比较意外的是nextEffect直接就是Fiber类型的吗？
        // 从首次渲染整个流程看下来，是returnFiber是指workInProgress
        // 后续看实际渲染时，到底是怎么个逻辑
        const last = returnFiber.lastEffect;
        if (last !== null) {
          last.nextEffect = childToDelete;
          returnFiber.lastEffect = childToDelete;
        } else {
          returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
        }
        childToDelete.nextEffect = null;
        childToDelete.effectTag = Deletion;

    deleteRemainingChildren(returnFiber, currentFirstChild,)
        // 这里可以看到直接一不做二不休直接全删了....
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
          deleteChild(returnFiber, childToDelete);
          childToDelete = childToDelete.sibling;
        }
        return null;

    reconcileSingleElement(returnFiber, currentFirstChild, element, expirationTime,)
        首先获取workInProgress下第一个子节点的key，与currentFirstChild的key对比
        从var child = currentFirstChild以及child = child.sibling下个兄弟节点循环下去
            如果一致{
                如果child是Fragment类型 则deleteRemainingChildren(returnFiber, child);
                如果不是 则deleteRemainingChildren(returnFiber, child);
            }
            如果不一致则 deleteChild(returnFiber, child)


    reconcileChildFibers(returnFiber, currentFirstChild, newChild, expirationTime,)
        // 这里根据我的理解
        // returnFiber是指最新的workInProgress，
        // currentFirstChild是指current下的第一个子节点
        // nextChildren是指workInProgress下第一个子节点
        根据newChild.$$typeof来判断 并 返回 workInProgress.child
        return placeSingleChild( reconcileSingleElement(returnFiber, currentFirstChild, newChild, expirationTime,),)
    return reconcileChildFibers;//函数内定义函数，这里返回子函数


问题清单:
1. scheduleUpdateOnFiber到底做了哪些东西
2. expirationTime是怎么个算法，越小优先级就越高吗？
  补充：后续怎么根据expirationTime来判断是否运行？
3. FiberNode类属性的childExpirationTime是什么鬼
4. doubleBuffer 又是什么鬼
5. markUpdateTimeFromFiberToRoot里这些函数都是什么鬼
    markUnprocessedUpdateTime
    markRootSuspendedAtTime
    markRootUpdatedAtTime
    firstSuspendedTime lastSuspendedTime lastPingedTime又是什么鬼
    firstPendingTime和lastPendingTime 最旧，最新挂起时间又是什么鬼
6. schedulePendingInteractions到底是什么鬼，什么情况下会用到__interactionsRef.current？
7. FiberRoot节点的lastExpiredTime到底是什么鬼？似乎会记录过期的任务
8. workInProgressRoot？renderExpirationTime？workInProgress？
9. updateExpirationTime < renderExpirationTime 是什么鬼概念？比如processUpdateQueue里就有
10. queue.firstCapturedUpdate是什么鬼？什么情况下会用到这个？目前仅知processUpdateQueue
11. processUpdateQueue下 什么情况下才会有updateExpirationTime < renderExpirationTime？
12. shouldTrackSideEffects是什么鬼？


参考资料:
1. https://github.com/jsonz1993/react-source-learn/issues/
2. https://github.com/KieSun/Dream/issues/
3. https://didiheng.com/react/2019-05-12.html（作者水准和我一样菜，仅供参考）
4. https://segmentfault.com/a/1190000020736992
5. https://github.com/AttackXiaoJinJin/reactExplain/blob/master/react16.8.6/packages/react-reconciler/src/ReactFiberExpirationTime.js
6. https://segmentfault.com/a/1190000020248630
7. https://juejin.im/post/5d01f630e51d4555fc1acc8b
8. https://cloud.tencent.com/developer/article/1507651
9. https://axiu.me/coding/fiber-intro-and-structure/
10. https://github.com/acdlite/react-fiber-architecture
11. https://zhuanlan.zhihu.com/p/55900504 （作者看上去有点功底，可以参考下）
12. https://zhuanlan.zhihu.com/p/40987447 
13. https://blog.csdn.net/luo_qianyu/article/details/103374486
14. http://que01.github.io/2019/08/28/v16-Scheduling-in-React/
15. https://www.youmeng.me/article/288
16. https://github.com/Foveluy/Luy/issues
17. https://react.jokcy.me/
18. https://www.jianshu.com/p/9c360697fe09
19. http://shymean.com/article/%E5%AE%9E%E7%8E%B0%E4%B8%80%E4%B8%AA%E7%AE%80%E6%98%93%E7%9A%84React
20. https://szhshp.org/tech/2019/08/10/reactindepthrender.html
21. https://zhuanlan.zhihu.com/p/36926155
22. https://www.cnblogs.com/lcllao/p/9642376.html
23. http://zxc0328.github.io/2017/09/28/react-16-source/
24. https://zhuanlan.zhihu.com/p/54042084
25. http://echizen.github.io/tech/2019/04-06-react-fibernode-diff
26. http://zxc0328.github.io/2017/09/28/react-16-source/（2017年的文章，可能过时了）
27. https://segmentfault.com/a/1190000017321684?utm_source=tag-newest（翻译国外文章，仅供参考）
28. https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/18
29. https://github.com/yygmind/blog/issues/43
30. https://juejin.im/post/5cb5b4926fb9a068b52fb823
31. https://juejin.im/post/5cb66fdaf265da0384128445
32. https://overreacted.io/zh-hans/react-as-a-ui-runtime/
33. https://github.com/react-guide/react-basic(React作者的设计初衷)
34. https://zhuanlan.zhihu.com/p/30171318(函数式编程 和 Redux的关系，与第33条链接有一定的关系)
35. https://zhuanlan.zhihu.com/p/76158581(代数效应（Algebraic Effects）第33条链接的最后一条)
36. https://segmentfault.com/a/1190000012834204（两年前的文章了，依然是理解React最重要的几篇文章之一）
