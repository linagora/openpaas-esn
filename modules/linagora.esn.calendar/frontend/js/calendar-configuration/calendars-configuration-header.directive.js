(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfigurationHeader', calendarsConfigurationHeader);

  function calendarsConfigurationHeader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/views/calendar-configuration/calendars-configuration-header.html',
      scope: {},
      replace: true,
      controller: CalendarsConfigurationHeaderController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  CalendarsConfigurationHeaderController.$inject = ['$state'];

  function CalendarsConfigurationHeaderController($state) {
    var vm = this;

    vm.cancel = cancel;

    ////////////

    function cancel() {
      $state.go('calendar.main');
    }
  }

})();
