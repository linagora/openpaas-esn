(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsList', calendarsList);

  function calendarsList() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/components/calendars-list.html',
      scope: {
        onEditClick: '=?'
      },
      replace: true,
      controller: CalendarsListController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  CalendarsListController.$inject = [
    '$rootScope',
    '$scope',
    'calendarService',
    'calendarVisibilityService',
    'session',
    'CALENDAR_EVENTS'
  ];

  function CalendarsListController($rootScope, $scope, calendarService, calendarVisibilityService, session, CALENDAR_EVENTS) {
    var vm = this;

    vm.onEditClick = vm.onEditClick || angular.noop;
    vm.calendars = [];
    vm.hiddenCalendars = {};
    vm.selectCalendar = selectCalendar;
    vm.toggleCalendar = calendarVisibilityService.toggle;

    activate();

    ////////////

    function activate() {
      listCalendars();
      getHiddenCalendars();

      var deregister = $rootScope.$on(CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) { // eslint-disable-line
        vm.hiddenCalendars[data.calendar.id] = data.hidden;
      });

      $scope.$on('$destroy', deregister);
    }

    function selectCalendar(calendar) {
      vm.calendars.forEach(function(cal) {
        cal.selected = calendar.id === cal.id;
      });

      vm.hiddenCalendars[calendar.id] && vm.toggleCalendar(calendar);
    }

    function listCalendars() {
      calendarService.listCalendars(session.user._id).then(function(calendars) {
        vm.calendars = calendars;
      });
    }

    function getHiddenCalendars() {
      calendarVisibilityService.getHiddenCalendars().forEach(function(calendar) {
        vm.hiddenCalendars[calendar.id] = true;
      });
    }
  }

})();
