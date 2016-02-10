'use strict';

angular.module('esn.calendar')

  .directive('eventFullForm', function($timeout, $state, eventUtils, headerService) {
    function link(scope, element, attrs) {
      headerService.subHeader.addInjection('event-full-form-subheader', scope);
      element.on('$destroy', eventUtils.resetStoredEvents);
    }

    return {
      scope: {
        event: '='
      },
      restrict: 'E',
      replace: true,
      controller: 'eventFormController',
      templateUrl: '/calendar/views/event-full-form/event-full-form.html',
      link: link
    };
  })

  .directive('eventFullFormSubheader', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/event-full-form/event-full-form-subheader.html'
    };
  });
