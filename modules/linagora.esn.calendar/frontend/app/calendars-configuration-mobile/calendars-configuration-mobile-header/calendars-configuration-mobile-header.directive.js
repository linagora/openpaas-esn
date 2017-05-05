(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarsConfigurationMobileHeader', calendarsConfigurationMobileHeader);

  function calendarsConfigurationMobileHeader() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendars-configuration-mobile/calendars-configuration-mobile-header/calendars-configuration-mobile-header.html',
      scope: {},
      replace: true,
      controller: CalendarsConfigurationHeaderController,
      controllerAs: '$ctrl',
      bindToController: true
    };

    return directive;
  }

  function CalendarsConfigurationHeaderController($state) {
    var self = this;

    self.cancel = cancel;

    ////////////

    function cancel() {
      $state.go('calendar.main');
    }
  }

})();
