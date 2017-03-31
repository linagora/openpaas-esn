(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calAttendeesList', calAttendeesList);

  function calAttendeesList() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/attendees-list/attendees-list.html',
      scope: {
        attendees: '=',
        readOnly: '=',
        organizer: '=',
        mode: '@'
      },
      replace: true,
      controller: AttendeesListController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  function AttendeesListController($scope, CALENDAR_EVENTS) {
    var self = this;

    self.attendeesPerPartstat = {};
    self.attendeeClickedCount = 0;
    self.selectAttendee = selectAttendee;
    self.deleteSelectedAttendees = deleteSelectedAttendees;

    activate();

    ////////////

    function activate() {
      updateAttendeeStats(self.attendees);
      $scope.$on(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function(event, data) { // eslint-disable-line
        updateAttendeeStats(data);
      });
    }

    function selectAttendee(attendee) {
      if (self.organizer.email !== attendee.email) {
        attendee.clicked = !attendee.clicked;
        self.attendeeClickedCount += attendee.clicked ? 1 : -1;
      }
    }

    function deleteSelectedAttendees() {
      self.attendees = self.attendees.filter(function(attendee) { return !attendee.clicked;});
    }

    function updateAttendeeStats(attendees) {
      var partstatMap = self.attendeesPerPartstat = {
        'NEEDS-ACTION': 0,
        ACCEPTED: 0,
        TENTATIVE: 0,
        DECLINED: 0,
        OTHER: 0
      };

      if (!attendees || !attendees.length) {
        return;
      }

      attendees.forEach(function(attendee) {
        partstatMap[attendee.partstat in partstatMap ? attendee.partstat : 'OTHER']++;
      });
    }
  }

})();
