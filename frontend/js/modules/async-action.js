'use strict';

angular.module('esn.async-action', ['esn.notification'])

.constant('ASYNC_ACTION_LONG_TASK_DURATION', 1000)

.factory('rejectWithErrorNotification', function($q, notificationFactory) {
  return function(message, cancelAction) {
    var notification = notificationFactory.weakError('Error', message);

    if (cancelAction) {
      notification.setCancelAction(cancelAction);
    }

    return $q.reject(new Error(message));
  };
})

.factory('asyncAction', function($q, $log, $timeout, notificationFactory, rejectWithErrorNotification, ASYNC_ACTION_LONG_TASK_DURATION) {
  function _computeMessages(message) {
    if (angular.isString(message)) {
      return {
        progressing: message + ' in progress...',
        success: message + ' succeeded',
        failure: message + ' failed'
      };
    }

    return message;
  }

  return function(message, action, options) {
    var isSilent = options && options.silent;
    var notification;
    var timeoutPromise;
    var messages = _computeMessages(message);

    if (!isSilent) {
      timeoutPromise = $timeout(function() {
        notification = notificationFactory.strongInfo('', messages.progressing);
      }, ASYNC_ACTION_LONG_TASK_DURATION, false);
    }

    return action()
      .then(function(value) {
        !isSilent && notificationFactory.weakSuccess('', messages.success);

        return value;
      }, function(err) {
        $log.error(err);
        rejectWithErrorNotification(messages.failure, options && options.onFailure);

        return $q.reject(err);
      })
      .finally(function() {
        notification && notification.close();
        timeoutPromise && $timeout.cancel(timeoutPromise);
      });
  };
});
