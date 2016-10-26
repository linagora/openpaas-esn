(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')
    .run(function(gracePeriodLiveNotificationService) {
      gracePeriodLiveNotificationService.start();
    });
})();
