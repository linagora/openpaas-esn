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

  .directive('calendarHeaderMobile', function(deviceDetector) {
    // The link function should be deleted once the fullcalendar.js is patched
    function link(scope, element) {
      scope.isMobile = deviceDetector.isMobile;
      if (deviceDetector.isMobile()) {
        scope.uiConfig.calendar.header = false;
      }
    }
    return {
      restrict: 'E',
      templateUrl: '/calendar/views/calendar/calendar-header-mobile.html',
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
  })

  .directive('toggleCalendarView', function(uiCalendarConfig) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.on('click', function() {
          uiCalendarConfig.calendars[scope.calendarId].fullCalendar('changeView', attrs.toggleCalendarView);
        });
      }
    };
  })

  .directive('toggleCalendarToday', function(uiCalendarConfig) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.on('click', function() {
          uiCalendarConfig.calendars[scope.calendarId].fullCalendar('today');
        });
      }
    };
  })


  .directive('toggleSubCalendar', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.click(function() {
          element.toggleClass('toggled');
          angular.element('.sub-calendar').stop(true, false).slideToggle(200);
        });
      }
    };
  });
