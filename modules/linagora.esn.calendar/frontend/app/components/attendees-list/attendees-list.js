(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('attendeesList', attendeesList);

  function attendeesList() {
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

  AttendeesListController.$inject = ['$scope', 'CALENDAR_EVENTS'];

  function AttendeesListController($scope, CALENDAR_EVENTS) {
    var vm = this;

    vm.attendeesPerPartstat = {};
    vm.attendeeClickedCount = 0;
    vm.selectAttendee = selectAttendee;
    vm.deleteSelectedAttendees = deleteSelectedAttendees;

    activate();

    ////////////

    function activate() {
      updateAttendeeStats(vm.attendees);
      $scope.$on(CALENDAR_EVENTS.EVENT_ATTENDEES_UPDATE, function(event, data) { // eslint-disable-line
        updateAttendeeStats(data);
      });
    }

    function selectAttendee(attendee) {
      if (vm.organizer.email !== attendee.email) {
        attendee.clicked = !attendee.clicked;
        vm.attendeeClickedCount += attendee.clicked ? 1 : -1;
      }
    }

    function deleteSelectedAttendees() {
      vm.attendees = vm.attendees.filter(function(attendee) { return !attendee.clicked;});
    }

    function updateAttendeeStats(attendees) {
      var partstatMap = vm.attendeesPerPartstat = {
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
