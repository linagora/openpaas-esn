(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')

    .factory('gracePeriodLiveNotificationService', gracePeriodLiveNotification);

  function gracePeriodLiveNotification($log, $q, livenotification, GRACE_EVENTS, _) {

    var listening = false;
    var sio;
    var listeners = {};

    return {
      start: start,
      registerListeners: registerListeners,
      unregisterListeners: unregisterListeners,
      getListeners: getListeners
    };

    function unregisterListeners(taskId) {
      if (!taskId) {
        throw new Error('Please provide a taskId');
      }

      delete listeners[taskId];
    }

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
        }).finally(function() {
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
        }).finally(function() {
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

    function registerListeners(taskId) {
      var deferred = $q.defer();

      if (!taskId) {
        throw new Error('Please provide a task');
      }

      if (!listeners[taskId]) {
        listeners[taskId] = [];
      }
      listeners[taskId].push({onError: deferred.reject, onDone: deferred.resolve});

      return deferred.promise;
    }

    function getListeners() {
      return _.clone(listeners);
    }
  }
})();
