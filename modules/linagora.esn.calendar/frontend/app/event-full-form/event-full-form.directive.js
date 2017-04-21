(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('calEventFullForm', calEventFullForm);

  function calEventFullForm($timeout, calEventUtils) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-full-form/event-full-form.html',
      scope: {
        event: '=',
        calendarHomeId: '='
      },
      link: link,
      replace: true,
      controller: 'CalEventFormController'
    };

    return directive;

    ////////////

    function link(scope, element) {
      $timeout(focusTitle, 0);
      element.on('$destroy', calEventUtils.resetStoredEvents);

      ////////////

      function focusTitle() {
        element.find('.title')[0].focus();
      }
    }
  }

})();
