(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calEventMessageService', calEventMessageService);

  function calEventMessageService() {
    var service = {
      computeAttendeeStats: computeAttendeeStats
    };

    return service;

    ////////////

    function computeAttendeeStats(attendees) {
      var partstatMap = {
        'NEEDS-ACTION': 0,
        ACCEPTED: 0,
        TENTATIVE: 0,
        DECLINED: 0,
        OTHER: 0
      };

      (attendees || []).forEach(function(attendee) {
        partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
      });

      return partstatMap;
    }
  }

})();
