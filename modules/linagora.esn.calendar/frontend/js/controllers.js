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
      }
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

  .controller('userCalendarController', ['$rootScope', '$scope', 'user', 'calendarService', 'calendarEventSource', 'USER_UI_CONFIG', function($rootScope, $scope, user, calendarService, calendarEventSource, USER_UI_CONFIG) {

    $scope.changeView = function(view, calendar) {
      calendar.fullCalendar('changeView', view);
    };

    $scope.renderCalendar = function(calendar) {
      calendar.fullCalendar('render');
    };
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
    $scope.eventSources = [calendarEventSource(user._id)];

    $rootScope.$on('addedEvent', function(event, data) { $scope.eventSources.push([data]); });
  }]);
