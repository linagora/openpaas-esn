(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventQuickForm', eventQuickForm);

  eventQuickForm.$inject = [
    '$timeout',
    'eventUtils'
  ];

  function eventQuickForm($timeout, eventUtils) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-quick-form/event-quick-form.html',
      link: link,
      replace: true,
      controller: 'eventFormController'
    };

    return directive;

    ////////////

    function link(scope, element) {
      $timeout(focusTitle, 0);
      element.on('$destroy', eventUtils.resetStoredEvents);
      scope.$on('$locationChangeStart', hideModal);

      ////////////

      function focusTitle() {
        element.find('.title')[0].focus();
      }

      function hideModal(event) {
        if (scope.$isShown) {
          event.preventDefault();
          scope.$hide();
        }
      }
    }
  }

})();
