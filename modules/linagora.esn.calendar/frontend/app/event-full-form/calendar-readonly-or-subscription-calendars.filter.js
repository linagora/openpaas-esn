(function() {
  'use strict';

  angular.module('esn.calendar')
    .filter('readonlyOrSubscriptionCalendars', readonlyOrSubscriptionCalendars);

  function readonlyOrSubscriptionCalendars(_) {
    return function(calendars) {
      return _.filter(calendars, function(calendar) {
        return !calendar.readOnly || calendar.isSubscription();
      });
    };
  }

})();
