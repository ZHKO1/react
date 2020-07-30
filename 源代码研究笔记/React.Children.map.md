React.Children.map
两点: 对象池的概念，对于性能的提升。
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
