scheduleCallback的源代码大致逻辑
源代码是 Scheduler.js 和 SchedulerHostConfig.default.js

SchedulerHostConfig.default.js比较关键的是requestHostCallback，requestHostTimeout，shouldYieldToHost
requestHostCallback是用MessageChannel来实现，居然没用到requestAnimationFrame
原理比较简单，每次调用requestHostCallback(参数是scheduledHostCallback)，就触发了port1.onmessage = performWorkUntilDeadline;
performWorkUntilDeadline函数 首先确定了currentTime 和 deadline，这两个表示这一轮开始时间到结束时间
接着就开始执行回调函数scheduledHostCallback(hasTimeRemaining, currentTime) //这里有个问题就是hasTimeRemaining全局搜索了下，怎么感觉永远是true啊？
如果回调结果返回true，则表示继续触发port1.onmessage = performWorkUntilDeadline，继续新的下一轮
如果回调结果返回false，则停止运行，不再有后续动作

shouldYieldToHost很简单，就是判定本轮时间是否结束？

requestHostTimeout更为简单，很明显就是延时（参数2 ms）执行回调函数（参数1 callback）

Scheduler.js则是提供unstable_scheduleCallback，flushWork，workLoop，handleTimeout，advanceTimers
unstable_scheduleCallback 接收(priorityLevel, callback, options)这三个参数
从而创建一个task对象，保存接收的参数
 startTime属性是开始时间，意外着如果到了，则可以考虑执行该task的callback（一般是目前时间，但如果有options.delay，则往后延）
 expirationTime属性是限期时间（startTime + timeout），意外着如果到了，则必须考虑执行该task的callback（timeout一般由priorityLevel来定，除非有options.timeout）
该task对象视情况压入到taskQueue 和 timerQueue
taskQueue是当前正在执行队列，意味着现在要做的事情 根据expirationTime排列
timerQueue是将要执行的队列，意味着现在不做但将来要做的事情，根据startTime排列
具体逻辑是：
如果startTime > currentTime，则压入到timerQueue，执行requestHostTimeout(handleTimeout, startTime - currentTime);
否则 压入到taskQueue，执行requestHostCallback(flushWork)
这里值得注意的是作者考虑到了频繁执行unstable_scheduleCallback的场景（比如疯狂setState），但是这并不会引起冲突

flushWork(hasTimeRemaining, initialTime)
  推测主要是设置isHostCallbackScheduled，isHostTimeoutScheduled参数
  执行workLoop(hasTimeRemaining, initialTime)
  也利用try{}finally{}特性在一切结束时重置currentTask，isPerformingWork等状态

workLoop(hasTimeRemaining, initialTime)
  let currentTime = initialTime; //获取当前时间
  advanceTimers(currentTime); //根据当前时间刷新timerQueue 和 taskQueue
  currentTask = peek(taskQueue);// 获取当前时间
  while(currentTask !== null)
    if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost()))
      // 需要同时满足两个条件，才会不执行当前currentTask
      // 1. 还没到当前currentTask的expirationTime（意思是当前Task还没到必须完成的时候，这帧理论上可以不执行当前Task）
      // 2. 当前getCurrentTime() >= deadline;（意思是这帧时间上已经耗尽了，等下一帧再执行当前Task吧）
      break;
    const callback = currentTask.callback;
    如果callback不为空
      currentTask.callback设置为空
      执行callback，如果有返回新的回调函数，则更新currentTask.callback
      如果没有，同时currentTask === peek(taskQueue) 则pop(taskQueue);
      //这里主要是考虑到执行currentTask时，万一有高优先级的task插入，当前currentTask就不一定是peek(taskQueue)
      currentTime = getCurrentTime();
      advanceTimers(currentTime);//执行了currentTask.callback会花时间，因此需要重新刷新
    为空
      pop(taskQueue);
    currentTask = peek(taskQueue);
  if (currentTask !== null)
    return true;
    // 情况1: 此轮时间已经耗尽，等下轮再执行任务
    // 情况2: 被暂停（不过我是没看到有这个操作，待以后研究）
  else
    // taskQueue任务已经执行完毕，剩下的只有timerQueue队列
    let firstTimer = peek(timerQueue);
    if (firstTimer !== null)
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    return false;

handleTimeout
  advanceTimers(currentTime);
  重新确认taskQueue队列是否都执行完毕
  不然的话继续requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
