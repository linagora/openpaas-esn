(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('eventDateEdition', eventDateEdition);

  function eventDateEdition() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/components/event-date-edition/event-date-edition.html',
      scope: {
        event: '=',
        disabled: '=?',
        dateOnBlur: '=?',
        allDayOnChange: '=?'
      },
      replace: true,
      controller: EventDateEditionController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  EventDateEditionController.$inject = ['fcMoment'];

  function EventDateEditionController(fcMoment) {
    var vm = this;

    vm.dateOnBlurFn = dateOnBlurFn;
    vm.getMinDate = getMinDate;
    vm.setEventDates = setEventDates;
    vm.onStartDateChange = onStartDateChange;
    vm.onEndDateChange = onEndDateChange;

    activate();

    ////////////

    function activate() {
      vm.disabled = angular.isDefined(vm.disabled) ? vm.disabled : false;
      vm.allDayOnChange = vm.allDayOnChange || angular.noop;
      vm.allDay = vm.event.allDay;
      // on load, ensure that duration between start and end is stored inside editedEvent
      vm.onEndDateChange();
    }

    function dateOnBlurFn() {
      //this is used to re-update views from the model in case the view is cleared
      vm.event.start = vm.event.start.clone();
      vm.event.end = vm.event.end.clone();
      if (angular.isFunction(vm.dateOnBlur)) {
        vm.dateOnBlur.apply(this, arguments);
      }
    }

    function getMinDate() {
      if (vm.allDay) {
        return fcMoment(vm.event.start).subtract(1, 'days').format('YYYY-MM-DD');
      }

      return null;
    }

    function setEventDates() {
      var start, end;

      if (vm.allDay) {
        vm.previousStart = vm.event.start.clone();
        vm.previousEnd = vm.event.end.clone();

        start = vm.event.start.stripTime();
        end = vm.event.end.stripTime().add(1, 'days');
      } else if (vm.previousStart && vm.previousEnd) {
        start = vm.previousStart;
        end = vm.previousEnd;
      } else {
        var nextHour = fcMoment().startOf('hour').add(1, 'hour').hour();

        // We need to set back the utc flag to false here.
        // See Ambiguously-timed Moments http://fullcalendar.io/docs/utilities/Moment/
        start = vm.event.start.local().startOf('day').hour(nextHour);
        end = vm.event.end.local().startOf('day').subtract(1, 'day').hour(nextHour).add(1, 'hours');
      }
      vm.event.start = start;
      vm.event.end = end;
      vm.diff = vm.event.end.diff(vm.event.start);
    }

    function onStartDateChange() {
      if (!vm.event.start || !vm.event.start.isValid()) {
        return;
      }
      vm.event.end = fcMoment(vm.event.start).add(vm.diff / 1000, 'seconds');
    }

    function onEndDateChange() {
      if (!vm.event.end || !vm.event.end.isValid()) {
        return;
      }
      if (vm.event.end.isBefore(vm.event.start)) {
        vm.event.end = fcMoment(vm.event.start).add(1, 'hours');
      }
      vm.diff = vm.event.end.diff(vm.event.start);
    }
  }

})();
