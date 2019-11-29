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

参考资料:
1. https://github.com/jsonz1993/react-source-learn/issues/
1. https://github.com/KieSun/Dream/issues/