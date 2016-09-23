(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('attendeeListItemConsult', attendeeListItemConsult);

  function attendeeListItemConsult() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/attendee-list-item-consult/attendee-list-item-consult.html',
      scope: {
        attendee: '=',
        isOrganizer: '='
      },
      replace: true,
      controller: AttendeeListItemConsultController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  AttendeeListItemConsultController.$inject = ['$injector'];

  function AttendeeListItemConsultController($injector) {
    var vm = this;

    vm.composerExists = $injector.has('composerDirective');
  }

})();
