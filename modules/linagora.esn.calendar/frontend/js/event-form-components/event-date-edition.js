'use strict';

angular.module('esn.calendar')
  .directive('eventDateEdition', function(FCMoment, calendarUtils) {
    function link(scope) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      scope.dateOnBlur = scope.dateOnBlur || function() {};
      scope.allDayOnChange = scope.allDayOnChange || function() {};

      scope.setEventDates = function() {
        if (scope.event.allDay) {
          scope.event.start.stripTime();
          scope.event.end.stripTime();
        } else {
          var nextHour = FCMoment().endOf('hour').add(1, 'seconds');
          // We need to set back the utc flag to false here.
          // See Ambiguously-timed Moments http://fullcalendar.io/docs/utilities/Moment/
          scope.event.start.time(nextHour.time()).local();
          scope.event.end.time(nextHour.time()).local();
        }
        scope.$broadcast('event-date-edition:allday:changed');
      };

      scope.getMinDate = function() {
        if (scope.event.start) {
          return FCMoment(scope.event.start).subtract(1, 'days');
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
        scope.event.end = FCMoment(scope.event.start).add(scope.event.diff / 1000, 'seconds');
      };

      scope.onEndDateChange = function() {
        if (!scope.event || !scope.event.end) {
          return;
        }
        if (scope.event.end.isBefore(scope.event.start)) {
          scope.event.end = FCMoment(scope.event.start).add(1, 'hours');
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

  .directive('friendlifyEndDate', function(FCMoment) {
    function link(scope, element, attrs, ngModel) {
      function subtractOneDayToView(value) {
        var valueToMoment = FCMoment(new Date(value));
        if (scope.event.allDay && !valueToMoment.isSame(scope.event.start, 'day')) {
          var valueToDisplay = valueToMoment.subtract(1, 'days').format('YYYY/MM/DD');
          ngModel.$setViewValue(valueToDisplay);
          ngModel.$render();
          return valueToDisplay;
        }
        return value;
      }

      function addOneDayToModel(value) {
        if (scope.event.allDay) {
          return FCMoment(value).add(1, 'days');
        }
        return FCMoment(value);
      }

      /**
       * Ensure that the view has a userfriendly end date output by removing 1 day to the event.end
       * if it is an allDay. We must do it because fullCalendar uses exclusive date/time end date.
       * Also it is not necessary to do it if the end date is same day than the start date.
       */
      ngModel.$formatters.unshift(subtractOneDayToView);

      /**
       * Ensure that if editedEvent is allDay, we had 1 days to event.end because fullCalendar and
       * caldav has exclusive date/time end date.
       */
      ngModel.$parsers.push(addOneDayToModel);

      scope.$on('event-date-edition:allday:changed', function() {
        if (!scope.event.allDay) {
          scope.event.end.subtract(1, 'days');
          // We get back default 1 hour event
          if (scope.event.start.isSame(scope.event.end, 'day')) {
            scope.event.end.add(1, 'hours');
          }
        } else {
          scope.event.end.add(1, 'days');
        }
        // Recalculate diff because end have changed outside the scope of
        // onEndDateChange
        scope.event.diff = scope.event.end.diff(scope.event.start);
      });
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  })

  .directive('dateToMoment', function(FCMoment) {
    function link(scope, element, attrs, controller) {
      function ensureFCMomentToModel(value) {
        if (scope.event.allDay) {
          return FCMoment(value).stripTime();
        }
        return FCMoment(value);
      }

      /**
       * Ensure that we only are using FCMoment type of date in our code.
       * It only strip the time if we are dealing with an allday event,
       * because angular-strap date-picker only send back a datetime date format
       * like "Sun Oct 11 2015 02:00:00 GMT+0200 (CEST)"
       */
      controller.$parsers.unshift(ensureFCMomentToModel);
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  });
