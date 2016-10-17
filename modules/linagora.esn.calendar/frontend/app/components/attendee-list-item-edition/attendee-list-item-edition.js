(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calAttendeeListItemEdition', calAttendeeListItemEdition);

  function calAttendeeListItemEdition() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/attendee-list-item-edition/attendee-list-item-edition.html',
      scope: {
        attendee: '=',
        readOnly: '=',
        isOrganizer: '='
      },
      replace: true
    };

    return directive;
  }

})();
