'use strict';

angular.module('esn.calendar')
  .constant('COMMUNITY_UI_CONFIG', {
    calendar: {
      height: 450,
      editable: true,
      timezone: 'local',
      forceEventDuration: true,
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
      editable: true,
      timezone: 'local',
      forceEventDuration: true,
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

  .controller('userCalendarController', ['$rootScope', '$window', '$modal', '$scope', '$timeout', 'uiCalendarConfig', 'user', 'calendarService', 'notificationFactory', 'calendarEventSource', 'USER_UI_CONFIG',
    function($rootScope, $window, $modal, $scope, $timeout, uiCalendarConfig, user, calendarService, notificationFactory, calendarEventSource, USER_UI_CONFIG) {

      var windowJQuery = angular.element($window);

      $scope.resizeCalendarHeight = function() {
        var calendar = uiCalendarConfig.calendars.userCalendar;
        calendar.fullCalendar('option', 'height', windowJQuery.height() - calendar.offset().top - 10);
      };

      $scope.eventClick = function(event) {
        $scope.event = event;
        $scope.event.startDate = event.start.toDate();
        $scope.event.endDate = event.end.toDate();
        $scope.modal = $modal({scope: $scope, template: '/calendar/views/partials/event-create-modal', backdrop: 'static'});
      };

      $scope.eventDropAndResize = function(event) {
        var path = '/calendars/' + user._id + '/events/' + event.id + '.ics';
        calendarService.modify(path, event).then(function() {
          notificationFactory.weakInfo('Event modified', event.title + ' is modified');
        });
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
      $scope.uiConfig.calendar.eventClick = $scope.eventClick;
      $scope.uiConfig.calendar.eventResize = $scope.eventDropAndResize;
      $scope.uiConfig.calendar.eventDrop = $scope.eventDropAndResize;
      $scope.eventSources = [calendarEventSource(user._id)];

      $rootScope.$on('modifiedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars.userCalendar.fullCalendar('updateEvent', data);
      });
      $rootScope.$on('removedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars.userCalendar.fullCalendar('removeEvents', data);
      });
      $rootScope.$on('addedCalendarItem', function(event, data) {
        uiCalendarConfig.calendars.userCalendar.fullCalendar('renderEvent', data);
      });
    }]);
