(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfiguration', calendarsConfiguration);

  function calendarsConfiguration() {
    var directive = {
      restrict: 'E',
      templateUrl: 'calendar/app/calendar-configuration/calendars-configuration.html',
      scope: {
        calendars: '='
      },
      replace: true,
      controller: CalendarsConfigurationController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  CalendarsConfigurationController.$inject = ['$state'];

  function CalendarsConfigurationController($state) {
    var vm = this;

    vm.calendars = vm.calendars || [];
    vm.modify = modify;
    vm.add = add;

    ////////////

    function modify(calendar) {
      $state.go('calendar.edit', {calendarId: calendar.id});
    }

    function add() {
      $state.go('calendar.add');
    }
  }

})();
