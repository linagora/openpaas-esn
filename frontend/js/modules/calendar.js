'use strict';

angular.module('esn.calendar', ['restangular', 'esn.session'])
  .controller('calendarController', ['$scope', '$log', '$location', 'calendarAPI', 'session', 'events', function($scope, $log, $location, calendarAPI, session, events) {
    var user = session.user;

    $scope.events = events.updated.map(function(event) {
      var result = {extId: event.extId, event: event};
      result.accepted = event.attendees.some(function(attendee) {
        return attendee.email === user.emails[0] && attendee.state === 'ACCEPTED';
      });
      return result;
    });

    $scope.accept = function(event) {
      calendarAPI.setEventStatus(event, 'ACCEPTED').then(
        function() {
          var id = event.extId || event;
          $scope.events.forEach(function(e) {
            if (e.extId === id) {
              e.accepted = true;
            }
          });
        },
        function(err) {
          $log.error('Error while setting event status', err.data);
        }
      );
    };

    $scope.reject = function(event) {
      calendarAPI.setEventStatus(event, 'NEEDS-ACTION').then(
        function() {
          var id = event.extId || event;
          $scope.events.forEach(function(e) {
            if (e.extId === id) {
              e.accepted = false;
            }
          });
        },
        function(err) {
          $log.error('Error while setting event status', err.data);
        }
      );
    };
  }])
  .factory('calendarAPI', ['Restangular', function(Restangular) {
    return {
      getEvents: function() {
        return Restangular.one('services/obm/events').get();
      },
      setEventStatus: function(event, status) {
        var id = event.extId || event;
        return Restangular.one('services/obm/events', id).put({state: status});
      }
    };
  }])
  .directive('eventDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/calendar/event.html'
    };
  });
