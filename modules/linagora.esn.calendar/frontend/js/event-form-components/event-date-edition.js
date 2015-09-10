'use strict';

angular.module('esn.calendar')
  .directive('eventDateEdition', function(moment) {
    function link(scope) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      scope.dateOnBlur = scope.dateOnBlur || function() {};
      scope.allDayOnChange = scope.allDayOnChange || function() {};

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
        if (!scope.event.end) {
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
        if (scope.event.allDay) {
          var valueToDisplay = moment(new Date(value)).subtract(1, 'days').format('YYYY/MM/DD');
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
       * if it is an allDay. We must does it because fullCalendar uses exclusive date/time end date.
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
