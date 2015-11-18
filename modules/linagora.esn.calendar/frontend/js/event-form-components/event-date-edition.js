'use strict';

angular.module('esn.calendar')
  .directive('eventDateEdition', function(fcMoment) {
    function link(scope) {
      scope.disabled = angular.isDefined(scope.disabled) ? scope.disabled : false;
      scope.dateOnBlur = scope.dateOnBlur || function() {};
      scope.allDayOnChange = scope.allDayOnChange || function() {};

      scope.allDay = scope.event.allDay;

      scope.getMinDate = function() {
        if (scope.event.start) {
          return fcMoment(scope.event.start).subtract(1, 'days');
        }
        return null;
      };

      scope.getMinTime = function() {
        if (scope.event.start && scope.event.start.isSame(scope.event.end, 'day')) {
          return scope.event.start;
        }
        return null;
      };

      scope.setEventDates = function() {
        var start = scope.event.start.clone();
        var end = scope.event.end.clone();
        if (scope.allDay) {
          start.stripTime();
          end.stripTime();
        } else {
          var nextHour = fcMoment().endOf('hour').add(1, 'seconds');
          // We need to set back the utc flag to false here.
          // See Ambiguously-timed Moments http://fullcalendar.io/docs/utilities/Moment/
          start.time(nextHour.time()).local();
          end.time(nextHour.time()).local();
        }
        scope.event.start = start.clone();
        scope.event.end = end.clone();
        scope.$broadcast('event-date-edition:allday:changed');
      };

      scope.onStartDateChange = function() {
        if (!scope.event.start) {
          return;
        }
        scope.event.end = fcMoment(scope.event.start).add(scope.event.diff / 1000, 'seconds');
      };

      scope.onEndDateChange = function() {
        if (!scope.event.end) {
          return;
        }
        if (scope.event.end.isBefore(scope.event.start)) {
          scope.event.end = fcMoment(scope.event.start).add(1, 'hours');
        }
        scope.diff = scope.event.end.diff(scope.event.start);
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

  .directive('friendlifyEndDate', function(fcMoment) {
    function link(scope, element, attrs, ngModel) {
      function subtractOneDayToView(value) {
        var valueToMoment = fcMoment(new Date(value));
        if (value && scope.event.allDay) {
          var valueToDisplay = valueToMoment.subtract(1, 'days').format('YYYY/MM/DD');
          ngModel.$setViewValue(valueToDisplay);
          ngModel.$render();
          return valueToDisplay;
        }
        return value;
      }

      function addOneDayToModel(value) {
        var valueToMoment = fcMoment(value);
        if (valueToMoment && scope.event.allDay) {
          valueToMoment.add(1, 'days');
        }
        return valueToMoment;
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
        var end = scope.event.end.clone();
        if (!scope.event.allDay) {
          if (!scope.event.start.isSame(end, 'day')) {
            end.subtract(1, 'days');
          }
          // We get back default 1 hour event
          if (scope.event.start.isSame(end, 'day')) {
            end.add(1, 'hours');
          }
        } else {
          if (!scope.event.start.isSame(end, 'day')) {
            end.add(1, 'days');
          }
        }
        // Recalculate diff because end have changed outside the scope of
        // onEndDateChange, we also update scope.event.end
        scope.event.end = end.clone();
        scope.event.diff = scope.event.end.diff(scope.event.start);
      });
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  })

  .directive('dateToMoment', function(fcMoment) {
    function link(scope, element, attrs, controller) {
      function ensureFCMomentToModel(value) {
        if (scope.event.allDay) {
          return fcMoment(value).stripTime();
        }
        return fcMoment(value);
      }

      /**
       * Ensure that we only are using fcMoment type of date in our code.
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
