'use strict';

angular.module('linagora.esn.graceperiod')

  .factory('gracePeriodAPI', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/graceperiod/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('gracePeriodLiveNotification', function($log, $q, livenotification, GRACE_EVENTS) {

    var listening = false;
    var sio;
    var listeners = {};

    function onError(data) {
      $log.debug('graceperiod error handlers for task', data.id);
      var handlers = listeners[data.id];

      if (handlers) {
        var onErrorHandlers = handlers.filter(function(handler) {
          return handler.onError;
        });

        $q.all(onErrorHandlers.map(function(handler) {
          return handler.onError(data);
        })).then(function() {
          $log.debug('All error handlers called for graceperiod task', data.id);
        }, function(err) {
          $log.error('Error while calling grace period error handler', err);
        }).finally (function() {
          unregisterListeners(data.id);
        });
      }
    }

    function onDone(data) {
      $log.debug('graceperiod done handlers for task', data.id);
      var handlers = listeners[data.id];

      if (handlers) {
        var onDoneHandlers = handlers.filter(function(handler) {
          return handler.onDone;
        });

        $q.all(onDoneHandlers.map(function(handler) {
          return handler.onDone(data);
        })).then(function() {
          $log.debug('All done handlers called for graceperiod task', data.id);
        }, function(err) {
          $log.error('Error while calling grace period done handler', err);
        }).finally (function() {
          unregisterListeners(data.id);
        });
      }
    }

    function start() {
      if (listening) {
        return sio;
      }

      if (!sio) {
        sio = livenotification('/graceperiod');
      }

      sio.on(GRACE_EVENTS.error, onError);
      sio.on(GRACE_EVENTS.done, onDone);

      listening = true;
      $log.debug('Start listening graceperiod live events');
      return sio;
    }

    function stop() {
      if (!listening) {
        return;
      }

      if (sio) {
        sio.removeListener(GRACE_EVENTS.error, onError);
        sio.removeListener(GRACE_EVENTS.done, onDone);
      }

      listening = false;
      $log.debug('Stop listening graceperiod live events');
    }

    function registerListeners(task, onError, onDone) {
      if (!task) {
        return;
      }

      if (!listeners[task]) {
        listeners[task] = [];
      }
      listeners[task].push({onError: onError, onDone: onDone});
    }

    function unregisterListeners(task) {
      if (!task) {
        return;
      }
      delete listeners[task];
    }

    function getListeners() {
      var result = {};
      angular.copy(listeners, result);
      return result;
    }

    return {
      start: start,
      stop: stop,
      registerListeners: registerListeners,
      unregisterListeners: unregisterListeners,
      getListeners: getListeners
    };

  })

  .factory('gracePeriodService', function($q, gracePeriodAPI, notifyOfGracedRequest) {
    var tasks = {};

    function remove(id) {
      if (tasks[id]) {
        delete tasks[id];
        return $q.when();
      } else {
        return $q.reject();
      }
    }

    function cancel(id) {
      return remove(id).then(function() {
        return gracePeriodAPI.one('tasks').one(id).remove();
      }, function() {
        return $q.reject('Canceling invalid task id: ' + id);
      });
    }

    function flush(id) {
      return remove(id).then(function() {
        return gracePeriodAPI.one('tasks').one(id).put();
      }, function() {
        return $q.reject('Flushing invalid task id: ' + id);
      });
    }

    function flushAllTasks() {
      return $q.all(Object.keys(tasks).map(function(id) {
        return flush(id);
      }));
    }

    function grace(id, text, linkText, delay, context) {
      if (context) {
        tasks[id] = context;
      }
      return notifyOfGracedRequest(text, linkText, delay);
    }

    function clientGrace(text, linkText, delay) {
      return notifyOfGracedRequest(text, linkText, delay);
    }

    function addTask(taskId, context) {
      if (taskId) {
        tasks[taskId] = context;
      }
    }

    function hasTaskFor(contextQuery) {
      return angular.isDefined(contextQuery) && Object.keys(tasks).some(function(taskId) {
          var taskContext = tasks[taskId];
          if (taskContext) {
            return Object.keys(contextQuery).every(function(contextKey) {
              return taskContext[contextKey] === contextQuery[contextKey];
            });
          }
          return false;
        });
    }

    return {
      grace: grace,
      clientGrace: clientGrace,
      cancel: cancel,
      flush: flush,
      flushAllTasks: flushAllTasks,
      remove: remove,
      addTaskId: addTask,
      hasTaskFor: hasTaskFor
    };
  })

  .factory('notifyOfGracedRequest', function(GRACE_DELAY, ERROR_DELAY, $q, $rootScope) {
    function appendCancelLink(text, linkText) {
      return text + ' <a class="cancel-task">' + linkText + '</a>';
    }

    return function(text, linkText, delay) {
      return $q(function(resolve) {
        var notification = $.notify({
          message: appendCancelLink(text, linkText)
        }, {
          type: 'success',
          text: appendCancelLink(text, linkText),
          placement: {
            from: 'bottom',
            align: 'center'
          },
          delay: delay || GRACE_DELAY,
          onClosed: function() {
            $rootScope.$applyAsync(function() {
              resolve({ cancelled: false });
            });
          }
        });

        notification.$ele.find('a.cancel-task').click(function() {
          $rootScope.$applyAsync(function() {
            resolve({
              cancelled: true,
              success: function() {
                notification.close();
              },
              error: function(errorMessage) {
                notification.update({
                  type: 'danger',
                  message: errorMessage,
                  delay: ERROR_DELAY
                });
              }
            });
          });
        });
      });
    };
  });
