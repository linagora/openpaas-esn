(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfigurationHeader', calendarsConfigurationHeader);

  function calendarsConfigurationHeader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar-configuration/calendars-configuration-header/calendars-configuration-header.html',
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
    var self = this;

    self.cancel = cancel;

    ////////////

    function cancel() {
      $state.go('calendar.main');
    }
  }

})();
