(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventFullForm', eventFullForm);

  eventFullForm.$inject = [
    '$timeout',
    'eventUtils'
  ];

  function eventFullForm($timeout, eventUtils) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-full-form/event-full-form.html',
      scope: {
        event: '='
      },
      link: link,
      replace: true,
      controller: 'eventFormController'
    };

    return directive;

    ////////////

    function link(scope, element) { // eslint-disable-line
      $timeout(focusTitle, 0);
      element.on('$destroy', eventUtils.resetStoredEvents);

      ////////////

      function focusTitle() {
        element.find('.title')[0].focus();
      }
    }
  }

})();
