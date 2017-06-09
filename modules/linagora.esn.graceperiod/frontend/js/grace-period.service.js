(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')
    .factory('gracePeriodService', gracePeriodService);

  function gracePeriodService(
    $timeout,
    $log,
    $q,
    _,
    notifyService,
    gracePeriodRestangularService,
    HTTP_LAG_UPPER_BOUND,
    GRACE_DELAY,
    ERROR_DELAY,
    $rootScope,
    gracePeriodLiveNotificationService,
    EsnI18nString,
    DEFAULT_GRACE_MESSAGE
  ) {
    var tasks = {};

    return {
      grace: grace,
      askUserForCancel: askUserForCancel,
      cancel: cancel,
      flush: flush,
      flushAllTasks: flushAllTasks,
      getTasksFor: getTasksFor,
      hasTask: hasTask
    };

    function removeTask(id) {
      var task = tasks[id];

      if (task) {
        task.notification && task.notification.close();
        delete tasks[id];
      }

      return !!task;
    }

    function retryCancelBeforeEnd(id, task, previousError) {
      return task.justBeforeEnd.then(function() {
        return gracePeriodRestangularService
          .one('tasks')
          .one(id)
          .withHttpConfig({timeout: HTTP_LAG_UPPER_BOUND}).remove();
      }, function() {

        throw previousError;
      });
    }

    function cancel(id) {
      var task = tasks[id];

      if (!removeTask(id)) {
        return $q.reject('Canceling invalid task id: ' + id);
      }

      return gracePeriodRestangularService
        .one('tasks')
        .one(id)
        .withHttpConfig({timeout: task.justBeforeEnd})
        .remove()
        .catch(function(error) {
          $log.error('Could not cancel graceperiod, we will try again at the end of the graceperiod', error);

          return retryCancelBeforeEnd(id, task, error);
        });
    }

    function flush(id) {
      if (!removeTask(id)) {
        return $q.reject('Flushing invalid task id: ' + id);
      }

      return gracePeriodRestangularService.one('tasks').one(id).put();
    }

    function flushAllTasks() {
      return $q.all(Object.keys(tasks).map(flush));
    }

    function getTasksFor(contextQuery) {
      var result = [];

      if (!angular.isDefined(contextQuery)) {
        return result;
      }

      Object.keys(tasks).forEach(function(taskId) {
        var contextMatched, taskContext = tasks[taskId].context;

        if (taskContext) {
          contextMatched = Object.keys(contextQuery).every(function(contextKey) {
            return taskContext[contextKey] === contextQuery[contextKey];
          });

          if (contextMatched) {
            result.push(taskId);
          }
        }
      });

      return result;
    }

    function timeoutPromise(duration) {
      return duration > 0 ? $timeout(angular.noop, duration) : $q.reject();
    }

    function addTask(taskId, context, notification, delay) {
      if (!taskId) {
        throw new Error('You should at least provide a task id');
      }

      tasks[taskId] = {
        notification: notification,
        context: context,
        justBeforeEnd: timeoutPromise((delay || GRACE_DELAY) - HTTP_LAG_UPPER_BOUND)
      };
    }

    function grace(options) {
      options = angular.extend({delay: GRACE_DELAY}, DEFAULT_GRACE_MESSAGE, options);

      if (!options.id) {
        throw new Error('You should at least provide an id');
      }

      var deferred = $q.defer();

      var userAskNotification = askUserForCancel(options.performedAction, options.cancelText, options.delay);
      var userCancelPromise = userAskNotification.promise;

      addTask(options.id, options.context, userAskNotification.notification, options.delay);

      var taskPromise = gracePeriodLiveNotificationService.registerListeners(options.id);
      var resolved = false;
      var cancelInTry = false;

      function checkNotResolved(callback) {
        return function() {
          if (!resolved) {
            callback.apply(this, arguments);
            resolved = true;
          }
        };
      }

      taskPromise.then(checkNotResolved(function() {
        displaySuccess(options.successText);
        deferred.resolve(cancelInTry ? {cancelled: true, cancelFailed: true} : {cancelled: false});
      }), checkNotResolved(function() {
        displayError(options.gracePeriodFail);
        deferred.reject(cancelInTry ? {cancelled: true, cancelFailed: false} : {cancelled: false});
      }));

      userCancelPromise.then(function(result) {
        if (!result.cancelled) {
          //we do not resolve the confirmation will be notified by the taskPromise
          return;
        }

        if (resolved) {
          displayError(options.cancelTooLate);
        } else {
          cancelInTry = true;
          cancel(options.id).then(checkNotResolved(function() {
            displaySuccess(options.cancelSuccess);
            deferred.reject({cancelled: true, cancelFailed: false});
            result.success();
          }), checkNotResolved(function(error) {
            result.error(options.cancelFailed, error.statusTask);
            deferred.resolve({cancelled: true, cancelFailed: true});
          }));
        }
      });

      deferred.promise.finally(function() {
        removeTask(options.id);
      });

      return deferred.promise;
    }

    function hasTask(taskId) {
      return !!tasks[taskId];
    }

    function displayMessage(message, type, delay) {
      if (!message) {
        return;
      }

      if (_.isString(message)) {
        notifyService({
          message: message
        }, {
          type: type,
          delay: delay
        });
      } else {
        var notification = notifyService({
          message: (message instanceof EsnI18nString) ? message : message.text,
          hideCross: message.hideCross
        }, {
          type: type,
          delay: message.delay || delay
        });

        notification.setCancelAction({
          linkText: message.actionText,
          action: function() {
            $rootScope.$applyAsync(function() {
              message.action();
            });
          }
        });
      }
    }

    function displayError(errorMessage) {
      displayMessage(errorMessage, 'danger', ERROR_DELAY);
    }

    function displaySuccess(message) {
      displayMessage(message, 'success');
    }

    function askUserForCancel(text, linkText, delay) {
      var deferred = $q.defer();

      var notification = notifyService({
        message: text
      }, {
        type: 'success',
        delay: delay,
        onClosed: function() {
          $rootScope.$applyAsync(function() {
            deferred.resolve({ cancelled: false });
          });
        }
      });

      notification.setCancelAction({
        linkText: linkText,
        action: function() {
          $rootScope.$applyAsync(function() {
            deferred.resolve({
              cancelled: true,
              success: function() {
                notification.close();
              },
              error: displayError
            });
          });
        }
      });

      return {
        notification: notification,
        promise: deferred.promise
      };
    }
  }
})();
