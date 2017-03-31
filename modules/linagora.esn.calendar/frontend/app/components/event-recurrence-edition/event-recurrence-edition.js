(function() {
  'use strict';

  angular.module('esn.calendar')
    .directive('eventRecurrenceEdition', eventRecurrenceEdition);

  function eventRecurrenceEdition() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/event-recurrence-edition/event-recurrence-edition.html',
      scope: {
        _event: '=event',
        isOrganizer: '=?',
        readOnlyEventFromSharedCalendar: '=?'
      },
      link: link,
      replace: true,
      controller: EventRecurrenceEditionController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    ////////////

    function link(scope, element, attrs, vm) { // eslint-disable-line no-unused-vars
      scope.selectEndRadioButton = selectEndRadioButton;

      function selectEndRadioButton(index) {
        var radioButtons = element.find('input[name="inlineRadioEndOptions"]');

        radioButtons[index].checked = true;
        // reset event.rrule.until if we are clicking on After ... occurrences input.
        if (index === 1) {
          vm.resetUntil();
        }
        // reset event.rrule.until if we are clicking on At ... input.
        if (index === 2) {
          vm.resetCount();
        }
      }
    }
  }

  function EventRecurrenceEditionController(RECUR_FREQ, WEEK_DAYS, MAX_RRULE_COUNT) {
    var self = this;

    self.RECUR_FREQ = RECUR_FREQ;
    self.WEEK_DAYS = Object.keys(WEEK_DAYS);
    self.toggleWeekdays = toggleWeekdays;
    self.resetUntil = resetUntil;
    self.resetCount = resetCount;
    self.setRRULE = setRRULE;
    self.MAX_RRULE_COUNT = MAX_RRULE_COUNT;

    activate();

    ////////////

    function activate() {
      self._event.getModifiedMaster().then(function(master) {
        self.readOnly = checkReadOnly();
        self.event = master;
        self.freq = self.event.rrule ? self.event.rrule.freq : undefined;
      });
    }

    function checkReadOnly() {
      return !self.isOrganizer || self._event.isInstance() || self.readOnlyEventFromSharedCalendar;
    }

    function toggleWeekdays(weekday) {
      var weekDaysValues = Object.keys(WEEK_DAYS).map(function(key) {
        return WEEK_DAYS[key];
      });
      var index = self.event.rrule.byday.indexOf(WEEK_DAYS[weekday]);
      var newDays = self.event.rrule.byday.slice();

      if (index > -1) {
        newDays.splice(index, 1);
      } else {
        newDays.push(WEEK_DAYS[weekday]);
      }
      newDays.sort(function(weekdayA, weekdayB) {
        if (weekDaysValues.indexOf(weekdayA) > weekDaysValues.indexOf(weekdayB)) {
          return 1;
        } else if (weekDaysValues.indexOf(weekdayA) < weekDaysValues.indexOf(weekdayB)) {
          return -1;
        } else {
          return 0;
        }
      });
      self.event.rrule.byday = newDays;
    }

    function resetUntil() {
      self.event.rrule.until = undefined;
    }

    function resetCount() {
      self.event.rrule.count = undefined;
    }

    function setRRULE() {
      if (!self.freq) {
        self.event.rrule = undefined;
      } else {
        self.event.rrule = {
          freq: self.freq,
          interval: self.event.rrule && self.event.rrule.interval || 1
        };
      }
    }
  }
})();
