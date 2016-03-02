'use strict';

angular.module('esn.datepickerUtils', [
    'ng.deviceDetector',
    'mgcrea.ngStrap.datepicker',
    'angular-clockpicker',
    'angularMoment'
])
.config(function($provide) {
  $provide.decorator('bsDatepickerDirective', function($delegate, bsDatepickerMobileWrapper) {
    var directive = $delegate[0];
    bsDatepickerMobileWrapper(directive);
    return $delegate;
  });
})
.config(function($provide) {
  $provide.decorator('clockpickerDefaultOptions', function($delegate) {
    return angular.extend({}, {nativeOnMobile: true}, $delegate);
  });
})
.factory('getRequiredController', function() {
  return function(controllerName, controller, directive) {
    var controllers = controller;
    var requires = directive.require;
    if (!angular.isArray(requires)) {
      controllers = [controller];
      requires = [requires];
    }
    var index = requires.indexOf(controllerName);
    if (index === -1) {
      throw new Error(controllerName + 'could not be find in required controller');
    }
    return controllers[index];
  };
})
.factory('bsDatepickerMobileWrapper', function(moment, detectUtils, getRequiredController) {

  function avoidDatepickerLagOnAndroid5(element) {
    element.attr('min', '1800-01-01');
    element.attr('max', '3000-01-01');
  }

  return function(directive) {
    var previousCompile = directive.compile;
    directive.compile = function() {
      var link = previousCompile.apply(this, arguments);
      return function(scope, element, attrs, controller) {
        var ngModel;
        if (detectUtils.isMobile()) {

          avoidDatepickerLagOnAndroid5(element);
          ['minDate', 'maxDate'].forEach(function(sourceAttr) {
            var destAttr = sourceAttr.replace(/Date/, '');
            attrs.$observe(sourceAttr, function(val) {
              val && element.attr(destAttr, moment(val).format('YYYY-MM-DD'));
            });
          });

          ngModel = getRequiredController('ngModel', controller, directive);

          ngModel.$formatters.push(function(date) {
            return moment(date).format('YYYY-MM-DD');
          });

          ngModel.$parsers.unshift(function(strDate) {
            var newDate = moment(strDate);
            var newDatetime = moment(ngModel.$modelValue);
            newDatetime.year(newDate.year());
            newDatetime.dayOfYear(newDate.dayOfYear());
            return newDatetime.toDate();
          });

          element.attr('type', 'date');
        } else {
          link.apply(this, arguments);
        }
      };
    };
  };
});
