(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')
    .constant('GRACE_DELAY', 8000)
    .constant('ERROR_DELAY', 5000)
    .constant('DEFAULT_GRACE_MESSAGE', {
      performedAction: 'You are about to perform an action',
      cancelText: 'Cancel it',
      successText: null,
      cancelSuccess: null,
      cancelFailed: 'An error has occured, cannot cancel this action',
      cancelTooLate: 'It is too late to cancel the action',
      gracePeriodFail: 'The action has failed'
    })
    .constant('GRACE_EVENTS', {
      error: 'graceperiod:error',
      done: 'graceperiod:done'
    });
})();
