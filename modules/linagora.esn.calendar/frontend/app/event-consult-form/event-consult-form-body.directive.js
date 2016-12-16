(function() {
  'use strict';

  angular.module('esn.calendar')
         .constant('CONSULT_FORM_TABS', {
           MAIN: 'main',
           ATTENDEES: 'attendees',
           MORE: 'more'
         })
         .directive('calEventConsultFormBody', calEventConsultFormBody);

  function calEventConsultFormBody(CONSULT_FORM_TABS) {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/event-consult-form/event-consult-form-body.html',
      link: link,
      replace: true
    };

    return directive;

    ////////////

    function link(scope) {
      scope.selectedTab = CONSULT_FORM_TABS.MAIN;
      scope.getMainView = getMainView;
      scope.getMoreView = getMoreView;
      scope.getAttendeesView = getAttendeesView;
      scope.onSwipe = onSwipe;

      ////////////

      function getMainView() {
        scope.selectedTab = CONSULT_FORM_TABS.MAIN;
      }

      function getAttendeesView() {
        scope.selectedTab = CONSULT_FORM_TABS.ATTENDEES;
      }

      function getMoreView() {
        scope.selectedTab = CONSULT_FORM_TABS.MORE;
      }

      function onSwipe(direction) {
        var availableTabs = [CONSULT_FORM_TABS.MAIN, CONSULT_FORM_TABS.ATTENDEES, CONSULT_FORM_TABS.MORE];
        var adjust = (direction === 'left') ? 1 : -1;
        var newTabIndex = availableTabs.indexOf(scope.selectedTab) + adjust;

        if (newTabIndex < 0) {
          newTabIndex = 0;
        } else if (newTabIndex >= availableTabs.length) {
          newTabIndex = availableTabs.length - 1;
        }

        scope.selectedTab = availableTabs[newTabIndex];
      }
    }
  }

})();
