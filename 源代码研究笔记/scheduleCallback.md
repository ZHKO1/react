scheduleCallback的源代码大致逻辑
源代码是 Scheduler.js 和 SchedulerHostConfig.default.js

SchedulerHostConfig.default.js比较关键的是requestHostCallback，requestHostTimeout，shouldYieldToHost
requestHostCallback是用MessageChannel来实现，居然没用到requestAnimationFrame
原理比较简单，每次调用requestHostCallback(参数是scheduledHostCallback)，就触发了port1.onmessage = performWorkUntilDeadline;
performWorkUntilDeadline函数 首先确定了currentTime 和 deadline，这两个表示这一轮开始时间到结束时间
接着就开始执行回调函数scheduledHostCallback
如果回调结果返回true，则表示继续触发port1.onmessage = performWorkUntilDeadline，继续新的下一轮
如果回调结果返回false，则停止运行，不再有后续动作

shouldYieldToHost很简单，就是判定本轮时间是否结束？

requestHostTimeout更为简单，很明显就是延时（参数2 ms）执行回调函数（参数1 callback）

Scheduler.js则是提供unstable_scheduleCallback
unstable_scheduleCallback 接收(priorityLevel, callback, options)这三个参数
从而创建一个task对象，保存接收的参数
 startTime属性是开始时间，意外着如果到了，则可以考虑执行该task的callback（一般是目前时间，但如果有options.delay，则往后延）
 expirationTime属性是限期时间（startTime + timeout），意外着如果到了，则必须考虑执行该task的callback（timeout一般由priorityLevel来定，除非有options.timeout）
该task对象视情况压入到taskQueue 和 timerQueue
taskQueue是当前正在执行队列，意味着现在要做的事情 根据expirationTime排列
timerQueue是将要执行的队列，意味着现在不做，但将来要做的事情，根据startTime排列
具体逻辑是：
如果startTime > currentTime，则压入到timerQueue，执行requestHostTimeout(handleTimeout, startTime - currentTime);
否则 压入到taskQueue


unstable_scheduleCallback(priorityLevel, callback, options)
  var currentTime = getCurrentTime();  
  var startTime;
  var timeout;//默认根据priorityLevel来判断。如果存在options.timeout，则按照options.timeout来
  根据options.delay来得出startTime
  var expirationTime = startTime + timeout;
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if(startTime > currentTime){
    // 延时
    
  }else{
    // 不延时
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

flushWork(hasTimeRemaining, initialTime)
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }
  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }

workLoop(hasTimeRemaining, initialTime)
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // 需要同时满足两个条件，才会不执行当前currentTask
      // 1. 还没到当前currentTask的expirationTime（意思是当前Task还没到必须完成的时候，这帧理论上不着急执行当前Task，当然你要现在完成也行，只是得看第2点）
      // 2. 当前当前getCurrentTime() >= deadline;（意思是这帧时间上已经耗尽了，等下一帧再执行当前Task吧）
      break;
    }
    const callback = currentTask.callback;
    if (callback !== null) {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  } else {
    let firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }

SchedulerHostConfig.default.js
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

shouldYieldToHost = function() {
  return getCurrentTime() >= deadline;
};
requestHostCallback = function(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};
const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    deadline = currentTime + yieldInterval;
    const hasTimeRemaining = true;
    try {
      const hasMoreWork = scheduledHostCallback(
        hasTimeRemaining,
        currentTime,
      );
      if (!hasMoreWork) {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      } else {
        port.postMessage(null);
      }
    } catch (error) {
      port.postMessage(null);
      throw error;
    }
  } else {
    isMessageLoopRunning = false;
  }
  needsPaint = false;
};


