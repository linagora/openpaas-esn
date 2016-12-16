(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calEventFullForm', calEventFullForm);

  function calEventFullForm($timeout, calEventUtils) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-full-form/event-full-form.html',
      scope: {
        event: '='
      },
      link: link,
      replace: true,
      controller: 'calEventFormController'
    };

    return directive;

    ////////////

    function link(scope, element) { // eslint-disable-line
      $timeout(focusTitle, 0);
      element.on('$destroy', calEventUtils.resetStoredEvents);

      ////////////

      function focusTitle() {
        element.find('.title')[0].focus();
      }
    }
  }

})();
