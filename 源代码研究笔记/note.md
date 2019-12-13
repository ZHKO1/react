**ReactDOM**

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
    enqueueUpdate(current, update); //保存update对象到fiber对象的updateQueue属性里
    scheduleWork(current, expirationTime);

scheduleUpdateOnFiber(和scheduleWork是同一个函数)
  checkForNestedUpdates 检查内嵌循环
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);



ReactFilberClassComponent.js
enqueueSetState
enqueueForceUpdate
上面两个区别是update.tag有所不同，共同点是跟updateContainer有点像。

问题清单:
1. scheduleUpdateOnFiber到底做了哪些东西
2. expirationTime是怎么个算法，越小优先级就越高吗？
3. FiberNode类属性的childExpirationTime是什么鬼
4. doubleBuffer 又是什么鬼


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
