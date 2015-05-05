'use strict';

angular.module('esn.calendar')
  .controller('communityCalendarController', ['$scope', 'community', 'calendarService', function($scope, community, calendarService) {

    $scope.changeView = function(view, calendar) {
      calendar.fullCalendar('changeView', view);
    };

    $scope.renderCalender = function(calendar) {
      calendar.fullCalendar('render');
    };

    $scope.uiConfig = {
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
    };

    function communityEventSource(start, end, timezone, callback) {
      var path = '/calendars/' + community._id + '/events/';
      return calendarService.list(path, start, end, timezone).then(callback);
    }

    $scope.eventSources = [communityEventSource];
  }])
  .controller('userCalendarController', ['$scope', 'user', 'calendarService', function($scope, user, calendarService) {

    $scope.changeView = function(view, calendar) {
      calendar.fullCalendar('changeView', view);
    };

    $scope.renderCalender = function(calendar) {
      calendar.fullCalendar('render');
    };

    function userEventSource(start, end, timezone, callback) {
      var path = '/calendars/' + user._id + '/calendar/';
      return calendarService.list(path, start, end, timezone).then(callback);
    }

    $scope.eventSources = [userEventSource];
  }]);
