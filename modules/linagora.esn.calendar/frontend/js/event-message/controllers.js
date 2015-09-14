'use strict';

angular.module('esn.calendar')

  .controller('eventMessageController', function($rootScope, $scope, calendarUtils, calendarService, calendarEventEmitter, moment, notificationFactory, EVENT_FORM) {

    $scope.editedEvent = {};
    $scope.restActive = false;
    $scope.EVENT_FORM = EVENT_FORM;

    this.initFormData = function() {
      $scope.editedEvent = {
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate(),
        allDay: false
      };
      $scope.activitystream = $scope.$parent.activitystream;
      // on load, ensure that duration between start and end is stored inside editedEvent
      this.onEndDateChange();
    };

    function _displayNotification(notificationFactoryFunction, title, content) {
      notificationFactoryFunction(title, content);
    }

    function _emitPostedMessage(response) {
      if (response && $scope.activitystream) {
        calendarEventEmitter.activitystream.emitPostedMessage(
          response.headers('ESN-Message-Id'),
          $scope.activitystream.activity_stream.uuid);
      }
    }

    this.addNewEvent = function() {
      if (!$scope.editedEvent.title || $scope.editedEvent.title.trim().length === 0) {
        $scope.editedEvent.title = EVENT_FORM.title.default;
      }

      if (!$scope.calendarId) {
        $scope.calendarId = calendarService.calendarId;
      }

      if (!$scope.activitystream.activity_stream && !$scope.activitystream.activity_stream.uuid) {
        $scope.displayError('You can not post to an unknown stream');
        return;
      }

      var event = $scope.editedEvent;
      var path = '/calendars/' + $scope.calendarId + '/events';
      var vcalendar = calendarService.shellToICAL(event);
      $scope.restActive = true;
      calendarService.createWithoutGrace(path, vcalendar)
        .then(function(response) {
          _emitPostedMessage(response);
          $scope.resetEvent();
          $scope.$parent.show('whatsup');
        })
        .catch (function(err) {
          _displayNotification(notificationFactory.weakError, 'Event creation failed', (err.statusText || err) + ', ' + 'Please refresh your calendar');
        })
        .finally (function() {
          $scope.restActive = false;
        });
    };

    this.resetEvent = function() {
      $scope.rows = 1;
      $scope.editedEvent = {
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate(),
        diff: 1,
        allDay: false
      };
    };

    this.getMinDate = function() {
      if ($scope.editedEvent.start) {
        return moment($scope.editedEvent.start).subtract(1, 'days');
      }
      return null;
    };

    this.getMinTime = function() {
      if ($scope.editedEvent.start && $scope.editedEvent.start.isSame($scope.editedEvent.end, 'day')) {
        return $scope.editedEvent.start;
      }
      return null;
    };

    this.onStartDateChange = function() {
      $scope.editedEvent.end = moment($scope.editedEvent.start).add($scope.editedEvent.diff / 1000 || 3600, 'seconds');
    };

    this.onEndDateChange = function() {
      if ($scope.editedEvent.end.isBefore($scope.editedEvent.start)) {
        $scope.editedEvent.end = moment($scope.editedEvent.start).add(1, 'hours');
      }
      $scope.editedEvent.diff = $scope.editedEvent.end.diff($scope.editedEvent.start);
    };
  });
