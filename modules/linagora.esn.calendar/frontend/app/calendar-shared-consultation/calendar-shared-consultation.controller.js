(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalendarSharedConsultController', CalendarSharedConsultController);

  function CalendarSharedConsultController($stateParams, calendarHomeService, calendarService, session, userAPI, _, CALENDAR_RIGHT) {
    var self = this;

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
          self.userRight = calendar.rights.getUserRight(self.user._id);

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
