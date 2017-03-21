(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarSharedConsultationController', CalendarSharedConsultationController);

  function CalendarSharedConsultationController($stateParams, $log, calendarHomeService, calendarService, session, CALENDAR_SHARED_RIGHT) {
    var self = this;
    var rightLabels = {};
    rightLabels[CALENDAR_SHARED_RIGHT.NONE] = 'None';
    rightLabels[CALENDAR_SHARED_RIGHT.SHAREE_READ] = 'Read only';
    rightLabels[CALENDAR_SHARED_RIGHT.SHAREE_READ_WRITE] = 'Read and Write';
    rightLabels[CALENDAR_SHARED_RIGHT.SHAREE_ADMIN] = 'Administration';
    rightLabels[CALENDAR_SHARED_RIGHT.SHAREE_FREE_BUSY] = 'Free/Busy';

    self.$onInit = $onInit;

    ////////////

    function $onInit() {
      if ($stateParams.calendarId) {
        calendarHomeService.getUserCalendarHomeId()
          .then(function(calendarHomeId) {
            var options = {
              withRights: true
            };

            return calendarService.getCalendar(calendarHomeId, $stateParams.calendarId, options);
          })
          .then(function(sharedCalendar) {
            var right = sharedCalendar.rights.getShareeRight(session.user._id);

            self.sharedCalendar = sharedCalendar;
            self.user = session.user;
            self.userRightLabel = right && rightLabels[right];

            return sharedCalendar.getOwner();
          })
          .then(function(owner) {
            self.sharedCalendarOwner = owner;
          });
      } else {
        $log.error('the calendar ID is missing from the URL');
      }
    }
  }
})();
