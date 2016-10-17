(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calAttendeeListItem', calAttendeeListItem);

  function calAttendeeListItem() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/attendee-list-item/attendee-list-item.html',
      scope: {
        attendee: '=',
        readOnly: '=',
        isOrganizer: '=',
        mode: '='
      },
      replace: true
    };

    return directive;
  }

})();
