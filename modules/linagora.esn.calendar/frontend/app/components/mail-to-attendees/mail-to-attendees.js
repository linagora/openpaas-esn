(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('mailToAttendees', mailToAttendees);

  function mailToAttendees() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/mail-to-attendees/mail-to-attendees.html',
      scope: {
        event: '='
      },
      replace: true,
      controller: MailToAttendeesController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  MailToAttendeesController.$inject = ['_'];

  function MailToAttendeesController(_) {
    var self = this;

    self.attendeesMail = _.pluck(self.event.attendees, 'email').join();
  }

})();
