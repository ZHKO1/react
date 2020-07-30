待研究问题清单:
1. unbatchedUpdates 在try{}finally{}里可以看到finally块里还补充了一个逻辑，flushSyncCallbackQueue这个函数是用来干什么的？
2. expirationTime是怎么个算法，越小优先级就越高吗？
  补充：后续怎么根据expirationTime来判断是否运行？
4. performSyncWorkOnRoot
5. update也有nextEffect，这个一般是派什么用场？





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
13. mountIndeterminateComponent什么情况下_current会存在？
14. effectTag下 PerformedWork是什么鬼？按照什么逻辑来？
15. class组件也是会走mountIndeterminateComponent这条路的？
16. completeUnitOfWork里为什么需要验证effectTag？还需要resetChildExpirationTime？
17. fiber节点的actualDuration 和 selfBaseDuration是什么鬼？
18. fiber节点的mode 什么情况下判定为 BlockingMode
18. performSyncWorkOnRoot的pushDispatcher是什么用？
19. fiber什么情况下会中断，什么情况下又会恢复？
20. 以applyDerivedStateFromProps为例，可以看到作者非常介意updateQueue，那么updateQueue到底什么情况下才会发挥作用呢？
21. ReactCurrentOwner.current这到底是干啥的？
