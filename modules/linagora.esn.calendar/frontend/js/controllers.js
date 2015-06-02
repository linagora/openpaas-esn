'use strict';

angular.module('esn.calendar')
  .constant('COMMUNITY_UI_CONFIG', {
    calendar: {
      height: 450,
      editable: false,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      }
    }
  })
  .constant('USER_UI_CONFIG', {
    calendar: {
      defaultView: 'agendaWeek',
      height: 450,
      editable: false,
      weekNumbers: true,
      firstDay: 1,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      // TODO: i18n
      buttonText: {
        today: 'Today',
        month: 'Month',
        week: 'Week',
        day: 'Day'
      },
      handleWindowResize: false
    }
  })

  .controller('communityCalendarController', ['$rootScope', '$scope', 'community', 'calendarService', 'calendarEventSource', 'COMMUNITY_UI_CONFIG', function($rootScope, $scope, community, calendarService, calendarEventSource, COMMUNITY_UI_CONFIG) {

    $scope.changeView = function(view, calendar) {
      calendar.fullCalendar('changeView', view);
    };

    $scope.renderCalender = function(calendar) {
      calendar.fullCalendar('render');
    };
    calendarService.calendarId = community._id;
    $scope.uiConfig = COMMUNITY_UI_CONFIG;
    $scope.eventSources = [calendarEventSource(community._id)];
    $rootScope.$on('addedEvent', function(event, data) { $scope.eventSources.push([data]); });
  }])

  .controller('userCalendarController', ['$rootScope', '$window', '$scope', '$timeout', 'uiCalendarConfig', 'user', 'calendarService', 'calendarEventSource', 'USER_UI_CONFIG', function($rootScope, $window, $scope, $timeout, uiCalendarConfig, user, calendarService, calendarEventSource, USER_UI_CONFIG) {
    var windowJQuery = angular.element($window);
    $scope.resizeCalendarHeight = function() {
      var calendar = uiCalendarConfig.calendars.userCalendar;
      calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
    };
    windowJQuery.resize($scope.resizeCalendarHeight);

    $scope.eventRender = function(event, element, view) {
      element.find('.fc-content').addClass('ellipsis');

      if (event.location) {
        var contentElement = element.find('.fc-title');
        contentElement.addClass('ellipsis');
        var contentHtml = contentElement.html() + ' (' + event.location + ')';
        contentElement.html(contentHtml);
      }

      if (event.description) {
        element.attr('title', event.description);
      }

      element.addClass('eventBorder');
    };

    calendarService.calendarId = user._id;
    $scope.uiConfig = USER_UI_CONFIG;
    $scope.uiConfig.calendar.eventRender = $scope.eventRender;

    /*
     * "eventAfterAllRender" is called when all events are fetched but it
     * is not called when the davserver is unreachable so the "viewRender"
     * event is used to set the correct height but the event is called too
     * early and the calendar offset is wrong so wait with a timeout.
     */
    $scope.uiConfig.calendar.eventAfterAllRender = $scope.resizeCalendarHeight;
    $scope.uiConfig.calendar.viewRender = function() {
      $timeout($scope.resizeCalendarHeight, 1000);
    };
    $scope.eventSources = [calendarEventSource(user._id)];

    $rootScope.$on('addedEvent', function(event, data) { $scope.eventSources.push([data]); });
  }]);
