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
  .directive('toggleNicescroll', function(deviceDetector) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        if (!deviceDetector.isMobile()) {
          element.parents('body').addClass('modal-open');
          if (element.parents().getNiceScroll(0)) {
            element.parents().getNiceScroll(0).hide();
          } else {
            element.parents().getNiceScroll().hide();
          }

          scope.$on('$locationChangeStart', function() {
            element.parents('body').removeClass('modal-open');
            if (element.parents().getNiceScroll(0)) {
              element.parents().getNiceScroll(0).show();
            } else {
              element.parents().getNiceScroll().show();
            }

          });
        }
      }
    };
  });
