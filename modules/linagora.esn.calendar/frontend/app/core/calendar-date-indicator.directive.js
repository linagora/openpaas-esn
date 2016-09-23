(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarDateIndicator', calendarDateIndicator);

  function calendarDateIndicator() {
    var directive = {
      restrict: 'A',
      scope: true,
      controller: CalendarDateIndicatorController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  CalendarDateIndicatorController.$inject = [
    '$scope',
    'uiCalendarConfig',
    'calendarService',
    'miniCalendarService',
    'CALENDAR_EVENTS'
  ];

  function CalendarDateIndicatorController($scope, uiCalendarConfig, calendarService, miniCalendarService, CALENDAR_EVENTS) {
    var vm = this;
    var miniCalendarIsShown = false;

    $scope.$on(CALENDAR_EVENTS.HOME_CALENDAR_VIEW_CHANGE, onCalendarHomeViewChange);
    $scope.$on(CALENDAR_EVENTS.MINI_CALENDAR.VIEW_CHANGE, onMiniCalendarHomeViewChange);
    $scope.$on(CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE, onMiniCalendarToggle);

    activate();

    ////////////

    function activate() {
      _calendarDateIndicator(uiCalendarConfig.calendars[calendarService.calendarHomeId].fullCalendar('getView'));
    }

    function onCalendarHomeViewChange(event, view) { // eslint-disable-line
      _calendarDateIndicator(view);
    }

    function onMiniCalendarHomeViewChange(event, view) { // eslint-disable-line
      if (miniCalendarIsShown) {
        _calendarDateIndicator(view || uiCalendarConfig.calendars[miniCalendarService.miniCalendarMobileId].fullCalendar('getView'));
      }
    }

    function onMiniCalendarToggle() {
      miniCalendarIsShown = !miniCalendarIsShown;
      if (miniCalendarIsShown) {
        _calendarDateIndicator(uiCalendarConfig.calendars[miniCalendarService.miniCalendarMobileId].fullCalendar('getView'));
      } else {
        _calendarDateIndicator(uiCalendarConfig.calendars[calendarService.calendarHomeId].fullCalendar('getView'));
      }
    }

    function _calendarDateIndicator(view) {
      vm.dateIndicator = view.title;
    }
  }

})();
