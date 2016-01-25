'use strict';

angular.module('esn.clockpicker', ['esn.core', 'angularMoment'])

  .factory('clockpickerService', function() {

    function parseTime(twelvehour, string) {
      var match = string && string.match(
          twelvehour ?
            /^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i :
            /^(\d{1,2}):(\d{1,2})$/
          );

      if (!match) {
        return;
      }

      var pm = match[3] && match[3].toUpperCase() === 'PM';
      var hour = parseInt(match[1], 10);
      var minute = parseInt(match[2], 10);

      if (minute > 59) {
        return;
      }

      if (twelvehour) {
        if (hour < 1 || hour > 12) {
          return;
        }

        hour = (hour % 12) + (pm ? 12 : 0);
      } else if (hour > 23) {
        return;
      }

      return {
        hour: hour,
        minute: minute
      };
    }

    return {
      parseTime: parseTime
    };
  })

  .constant('clockpickerDefaultOptions', {
    twelvehour: true,
    autoclose: false,
    donetext: 'ok'
  })

  .directive('clockpickerWrapper', function(clockpickerService, clockpickerDefaultOptions, moment, $timeout, detectUtils) {

    function link(scope, element, attr, ngModel) {

      var options = angular.extend({}, clockpickerDefaultOptions, scope.$eval(attr.clockpickerOptions));

      var formatTime = options.twelvehour ? 'hh:mm A' : 'HH:mm';

      element.clockpicker(options);

      if (detectUtils.isMobile() && !element.is('[readonly]')) {
        element.attr('readonly', 'readonly');
        element.addClass('ignore-readonly');
      }

      function getModelValue() {
        return ngModel.$modelValue ? ngModel.$modelValue.clone() : moment();
      }

      getModelValue();

      var parseViewValue = clockpickerService.parseTime.bind(null, options.twelvehour);

      element.blur(function() {
        ngModel.$valid && element.val(getModelValue().local().format(formatTime));
      });

      ngModel.$render = function(val) {
        element.val(ngModel.$viewValue || '');
      };

      ngModel.$parsers.push(function(val) {
        var time = parseViewValue(val);
        ngModel.$setValidity('badFormat', !!time);
        if (!time) {
          return getModelValue();
        }
        var inUtc = getModelValue().isUTC();
        var newDate = moment(getModelValue());
        newDate = newDate.local();
        newDate.hour(time.hour);
        newDate.minute(time.minute);
        newDate.second(0);
        return inUtc ? newDate.utc() : newDate;
      });

      ngModel.$formatters.push(function(momentDate) {
        var val = parseViewValue(ngModel.$viewValue);

        if (!momentDate) {
          return '';
        }

        var localMomentDate = momentDate.clone().local();
        var isSameTime = !val ||
          (val.hour === localMomentDate.hour() && val.minute === localMomentDate.minute());

        return (element.is(':focus') && isSameTime) ?
          ngModel.$viewValue :
          localMomentDate.format(formatTime);
      });
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  });
