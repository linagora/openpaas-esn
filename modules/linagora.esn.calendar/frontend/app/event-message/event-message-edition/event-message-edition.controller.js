(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('CalEventMessageEditionController', CalEventMessageEditionController);

  function CalEventMessageEditionController(
    $scope,
    CalendarShell,
    calendarUtils,
    calendarService,
    calEventService,
    calendarEventEmitter,
    notificationFactory,
    esnI18nService,
    CAL_EVENT_FORM,
    CAL_DEFAULT_CALENDAR_ID
  ) {

    var self = this;

    self.submit = submit;
    self.$onInit = $onInit;

    //////////

    function $onInit() {
      self.event = CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate()
      });
      self.restActive = false;
      self.CAL_EVENT_FORM = CAL_EVENT_FORM;
    }

    function emitPostedMessage(response) {
      if (response && self.activitystream) {
        calendarEventEmitter.activitystream.emitPostedMessage(
            response.headers('ESN-Message-Id'),
            self.activitystream.activity_stream.uuid);
      }
    }

    function resetEvent() {
      self.rows = 1;
      self.event = CalendarShell.fromIncompleteShell({
        start: calendarUtils.getNewStartDate(),
        end: calendarUtils.getNewEndDate(),
        diff: 1
      });
    }

    function submit() {
      if (!self.event.title || self.event.title.trim().length === 0) {
        self.event.title = CAL_EVENT_FORM.title.default;
      }

      if (!self.activitystream.activity_stream || !self.activitystream.activity_stream.uuid) {
        $scope.displayError('You can not post to an unknown stream');

        return;
      }

      var path = '/calendars/' + self.calendarHomeId + '/' + CAL_DEFAULT_CALENDAR_ID;

      self.restActive = true;
      calEventService.createEvent(self.calendarHomeId, path, self.event, { graceperiod: false })
        .then(function(response) {
          emitPostedMessage(response);
          resetEvent();
          $scope.$parent.show('whatsup');
        })
      .catch(function(err) {
        notificationFactory.weakError('Event creation failed', esnI18nService.translate('%s, Please refresh your calendar', err.statusText || err));
      })
      .finally(function() {
        self.restActive = false;
      });
    }
  }
})();
