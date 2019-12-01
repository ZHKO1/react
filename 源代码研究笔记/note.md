**ReactDOM**

React.Children.map
对象池的概念，对于性能的提升。

ReactDOM.render 的大致思路
function render(element, container)
跳转 -> function legacyRenderSubtreeIntoContainer(container)
    初始挂载    原生容器root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate)
                fiberRoot = root._internalRoot;

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
stateNode 绑定了FiberRootNode
return 父节点
child 子节点
sibling 兄弟节点
这里需要注意 effectTag属性 和 alternate属性，看看后续会不会用到


unbatchedUpdates
  executionContext 去除 BatchedContext位，声明 LegacyUnbatchedContext位
  回调 -> updateContainer()
    requestCurrentTimeForUpdate 获取目前的时间
    computeExpirationForFiber(currentTime, current, suspenseConfig)
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
    const update = createUpdate(expirationTime, suspenseConfig); 创建个update对象，值得注意的是对象的tag属性是UpdateState（值为0）
    enqueueUpdate(current, update); 保存update对象到fiber对象的updateQueue属性里
    scheduleWork(current, expirationTime);








参考资料:
1. https://github.com/jsonz1993/react-source-learn/issues/
2. https://github.com/KieSun/Dream/issues/
3. https://didiheng.com/react/2019-05-12.html（待读）
4. https://segmentfault.com/a/1190000020736992
5. https://github.com/AttackXiaoJinJin/reactExplain/blob/master/react16.8.6/packages/react-reconciler/src/ReactFiberExpirationTime.js
6. https://segmentfault.com/a/1190000020248630
7. https://juejin.im/post/5d01f630e51d4555fc1acc8b

