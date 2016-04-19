'use strict';
angular.module('esn.calendar')

  .directive('mailToAttendees', function(_) {
    function link(scope) {
      scope.attendeesMail = _.pluck(scope.event.attendees, 'email').join();
    }

    return {
      restrict: 'E',
      scope: {
        event: '='
      },
      replace: true,
      templateUrl: '/calendar/views/components/mail-to-attendees.html',
      link: link
    };
  });
