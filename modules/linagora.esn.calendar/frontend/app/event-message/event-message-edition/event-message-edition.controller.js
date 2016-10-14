
'use strict';

angular.module('esn.calendar')
.controller('calEventMessageEditionController', function($scope, CalendarShell, calendarUtils, calendarService, calEventService, calendarEventEmitter, notificationFactory, EVENT_FORM, DEFAULT_CALENDAR_ID) {

  function _initFormData() {
    $scope.event = CalendarShell.fromIncompleteShell({
      start: calendarUtils.getNewStartDate(),
      end: calendarUtils.getNewEndDate()
    });
    $scope.restActive = false;
    $scope.EVENT_FORM = EVENT_FORM;
    $scope.activitystream = $scope.$parent.activitystream;
  }

  function _emitPostedMessage(response) {
    if (response && $scope.activitystream) {
      calendarEventEmitter.activitystream.emitPostedMessage(
          response.headers('ESN-Message-Id'),
          $scope.activitystream.activity_stream.uuid);
    }
  }

  function _resetEvent() {
    $scope.rows = 1;
    $scope.event = CalendarShell.fromIncompleteShell({
      start: calendarUtils.getNewStartDate(),
      end: calendarUtils.getNewEndDate(),
      diff: 1
    });
  }

  $scope.submit = function() {
    if (!$scope.event.title || $scope.event.title.trim().length === 0) {
      $scope.event.title = EVENT_FORM.title.default;
    }

    if (!$scope.activitystream.activity_stream || !$scope.activitystream.activity_stream.uuid) {
      $scope.displayError('You can not post to an unknown stream');

      return;
    }

    var event = $scope.event;
    var calendarHomeId = $scope.calendarHomeId || calendarService.calendarHomeId;
    var path = '/calendars/' + calendarHomeId + '/' + DEFAULT_CALENDAR_ID;

    $scope.restActive = true;
    calEventService.createEvent(calendarHomeId, path, event, { graceperiod: false })
      .then(function(response) {
        _emitPostedMessage(response);
        _resetEvent();
        $scope.$parent.show('whatsup');
      })
    .catch(function(err) {
      notificationFactory.weakError('Event creation failed', (err.statusText || err) + ', Please refresh your calendar');
    })
    .finally(function() {
      $scope.restActive = false;
    });
  };

  // We must init the form on directive load
  _initFormData();
});
