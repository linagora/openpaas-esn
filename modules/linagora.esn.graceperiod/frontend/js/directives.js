'use strict';

angular.module('linagora.esn.graceperiod')

  .directive('gracePeriodListenerInitializer', function(gracePeriodLiveNotification) {
    return {
      restrict: 'A',
      link: function() {
        gracePeriodLiveNotification.start();
      }
    };
  });
