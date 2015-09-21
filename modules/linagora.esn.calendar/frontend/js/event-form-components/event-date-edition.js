'use strict';

angular.module('esn.calendar')
  .directive('eventDateEdition', function(moment, calendarUtils) {
    function link(scope) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      scope.dateOnBlur = scope.dateOnBlur || function() {};
      scope.allDayOnChange = scope.allDayOnChange || function() {};

      // The first time the directive is loaded, we need to know if we will have to reset date
      // to default value. This reset should also be done only the first time we are clicking the allday checkbox.
      // After that start and end will be computed depending on scope.event.diff.
      var resetDate = scope.event.allDay;

      scope.resetToDefaultDate = function() {
        if (resetDate) {
          scope.event.start = calendarUtils.getNewStartDate();
          scope.event.end = calendarUtils.getNewEndDate();
          resetDate = false;
        }
      };

      scope.getMinDate = function() {
        if (scope.event.start) {
          return moment(scope.event.start).subtract(1, 'days');
        }
        return null;
      };

      scope.getMinTime = function() {
        if (scope.event.start && scope.event.start.isSame(scope.event.end, 'day')) {
          return scope.event.start;
        }
        return null;
      };

      scope.onStartDateChange = function() {
        if (!scope.event.start) {
          return;
        }
        scope.event.end = moment(scope.event.start).add(scope.event.diff / 1000, 'seconds');
      };

      scope.onEndDateChange = function() {
        if (!scope.event || !scope.event.end) {
          return;
        }
        if (scope.event.end.isBefore(scope.event.start)) {
          scope.event.end = moment(scope.event.start).add(1, 'hours');
        }
        scope.event.diff = scope.event.end.diff(scope.event.start);
      };

      // on load, ensure that duration between start and end is stored inside editedEvent
      scope.onEndDateChange();
    }

    return {
      restrict: 'E',
      scope: {
        event: '=',
        disabled: '=?',
        dateOnBlur: '=?',
        allDayOnChange: '=?'
      },
      replace: true,
      templateUrl: '/calendar/views/event-form-components/event-date-edition.html',
      link: link
    };
  })

  .directive('friendlifyEndDate', function(moment) {
    function link(scope, element, attrs, ngModel) {
      function _ToView(value) {
        var valueToMoment = moment(new Date(value));
        if (scope.event.allDay && !valueToMoment.isSame(scope.event.start, 'day')) {
          var valueToDisplay = valueToMoment.subtract(1, 'days').format('YYYY/MM/DD');
          ngModel.$setViewValue(valueToDisplay);
          ngModel.$render();
          return valueToDisplay;
        }
        return value;
      }

      function _toModel(value) {
        if (scope.event.allDay) {
          return moment(value).add(1, 'days');
        }
        return value;
      }

      /**
       * Ensure that the view has a userfriendly end date output by removing 1 day to the event.end
       * if it is an allDay. We must do it because fullCalendar uses exclusive date/time end date.
       * Also it is not necessary to do it if the end date is same day than the start date.
       */
      ngModel.$formatters.unshift(_ToView);

      /**
       * Ensure that if editedEvent is allDay, we had 1 days to event.end because fullCalendar and
       * caldav has exclusive date/time end date.
       */
      ngModel.$parsers.push(_toModel);
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  })

  .directive('dateToMoment', function(moment) {
    function link(scope, element, attrs, controller) {
      function _toModel(value) {
        return moment(value);
      }

      /**
       * Ensure that we only are using moment type of date in hour code
       */
      controller.$parsers.unshift(_toModel);
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  });
