'use strict';

angular.module('linagora.esn.graceperiod')

  .constant('GRACE_DELAY', 8000)
  .constant('ERROR_DELAY', 5000)
  .constant('GRACE_EVENTS', {
    error: 'graceperiod:error',
    done: 'graceperiod:done'
  });
