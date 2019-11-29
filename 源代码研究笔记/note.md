**ReactDOM**

React.Children.map
对象池的概念，对于性能的提升。

ReactDOM.render 的大致思路
function render(element, container)
跳转 -> function legacyRenderSubtreeIntoContainer(container)
    初始挂载    原生容器root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container,forceHydrate)
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
    markContainerAsRoot(root.current, container);//标记container[""] = root.current
    return root;

function createContainer(containerInfo, tag, hydrate, hydrationCallbacks)
    return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);

function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks)
    const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
    const uninitializedFiber = createHostRootFiber(tag);
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    return root;
