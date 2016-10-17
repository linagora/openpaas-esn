(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calAttendeeListItemConsult', calAttendeeListItemConsult);

  function calAttendeeListItemConsult() {
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
    var self = this;

    self.composerExists = $injector.has('composerDirective');
  }

})();
