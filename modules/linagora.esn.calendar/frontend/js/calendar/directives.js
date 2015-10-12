'use strict';

angular.module('esn.calendar')
  .directive('calendarDisplay', function($timeout) {
    function link(scope, element) {
      $timeout(function() {
        var today = element.find('.fc-today-button');
        today.addClass('btn waves-effect');
        var buttonGroup = element.find('.fc-button-group');
        buttonGroup.addClass('btn-group');
        buttonGroup.children().addClass('btn waves-effect');
      }, 0);
    }
    return {
      restrict: 'E',
      templateUrl: 'calendar/views/calendar/calendar.html',
      scope: {
        calendarId: '=',
        uiConfig: '='
      },
      controller: 'calendarController',
      link: link
    };
  })

  .directive('calendarButtonToolbar', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar/community-calendar-button-toolbar.html'
    };
  })

  .directive('calendarNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar/user-calendar-navbar-link.html'
    };
  })

  .directive('calendarLeftPane', function() {
    function link(scope, element) {
      scope.$on('calendar:height', function(event, height) {
        element.height(height);
      });
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar/calendar-left-pane.html',
      link: link
    };
  })

  .directive('toggleRightSidebarCalendarButton', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/calendar/views/calendar/toggle-right-sidebar-calendar-button.html'
    };
  });
