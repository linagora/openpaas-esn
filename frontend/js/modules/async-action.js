'use strict';

angular.module('esn.async-action', [
  'esn.notification',
  'esn.constants'
])

.factory('rejectWithErrorNotification', function($q, notificationFactory) {
  return function(message, options) {
    options = options || {};
    var notification = options.persist === true ?
      notificationFactory.strongError('Error', message) :
      notificationFactory.weakError('Error', message);

    options.onFailure && notification.setCancelAction(options.onFailure);
    options.onClose && notification.setCloseAction(options.onClose);

    return $q.reject(new Error(message));
  };
})

.factory('notifySuccessWithFollowingAction', function(notificationFactory) {
  return function(message, followingAction) {
    var notification = notificationFactory.weakSuccess('Success', message);

    if (followingAction) {
      notification.setCancelAction(followingAction);
    }
  };
})

.factory('asyncAction', function($q, $log, $timeout, notificationFactory, notifySuccessWithFollowingAction, rejectWithErrorNotification, ASYNC_ACTION_LONG_TASK_DURATION, esnI18nService) {
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

  function _getMessage(messages, type, arg) {
    var stringOrFunction = messages[type];
    if (angular.isString(stringOrFunction) || esnI18nService.isI18nString(stringOrFunction)) {

      return stringOrFunction;
    }
    if (typeof stringOrFunction === 'function') {

      return stringOrFunction(arg);
    }

    return;
  }

  return function(message, action, options) {
    var isSilent = options && options.silent;
    var notification;
    var timeoutPromise;
    var messages = _computeMessages(message);

    if (!isSilent) {
      timeoutPromise = $timeout(function() {
        notification = notificationFactory.strongInfo('', _getMessage(messages, 'progressing'));
      }, ASYNC_ACTION_LONG_TASK_DURATION, false);
    }

    return action()
      .then(function(value) {
        !isSilent && notifySuccessWithFollowingAction(
          _getMessage(messages, 'success', value),
          options && options.onSuccess
        );

        return value;
      }, function(err) {
        $log.error(err);
        rejectWithErrorNotification(_getMessage(messages, 'failure', err), options);

        return $q.reject(err);
      })
      .finally(function() {
        notification && notification.close();
        timeoutPromise && $timeout.cancel(timeoutPromise);
      });
  };
});
