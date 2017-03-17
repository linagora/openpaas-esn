(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarSharedConsultController', CalendarSharedConsultController);

  function CalendarSharedConsultController($stateParams, calendarHomeService, calendarService, session, userAPI, _, CALENDAR_RIGHT, CALENDAR_SHARED_RIGHT) {
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
      calendarHomeService.getUserCalendarHomeId()
        .then(function(calendarHomeId) {
          var options = {
            withRights: true
          };

          return calendarService.getCalendar(calendarHomeId, $stateParams.calendarId, options);
        })
        .then(function(calendar) {
          self.calendar = calendar;
          self.user = session.user;
          var right = calendar.rights.getShareeRight(self.user._id);
          self.userRightLabel = right && rightLabels[right];

          getCalendarOwnerFromSharedCalendar(calendar);
        });
    }

    function getCalendarOwnerFromSharedCalendar(calendar) {
      var calendarInvitesIds = _.keys(calendar.rights._userEmails);

      calendarInvitesIds.some(function(userId) {
        if (isAdmin(calendar, userId)) {
          userAPI.user(userId).then(function(response) {
            self.calendarOwner = response.data;

            return true;
          });
        }
      });
    }

    function isAdmin(calendar, userId) {
      return calendar.rights.getUserRight(userId) === CALENDAR_RIGHT.ADMIN;
    }
  }
})();
