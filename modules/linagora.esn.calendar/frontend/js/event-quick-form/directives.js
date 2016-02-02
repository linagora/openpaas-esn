'use strict';

angular.module('esn.calendar')
  .directive('eventQuickForm', function($location, $timeout, eventUtils) {
    function link(scope, element, attrs, controller) {
      // We must initialized the scope here, before every inner directives
      scope.initFormData();

      $timeout(function() {
        element.find('.title')[0].focus();
      }, 0);
      element.on('$destroy', eventUtils.resetStoredEvents);
      scope.$on('$locationChangeStart', function(event) {
        if (scope.$isShown) {
          event.preventDefault();
          scope.$hide();
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      controller: 'eventFormController',
      templateUrl: '/calendar/views/event-quick-form/event-quick-form.html',
      link: link
    };
  });
