'use strict';

angular.module('esn.datepickerUtils', [
    'ng.deviceDetector',
    'angularMoment'
]).factory('bsDatepickerMobileWrapper', function(moment, detectUtils) {
      return function(directive) {
        var link = directive.link;
        var require = directive.require;
        directive.compile = function() {
          return function(scope, element, attrs, controller) {
            var controllers = controller;
            var requires = require;
            var ngModel;

            if (detectUtils.isMobile()) {

              ['minDate', 'maxDate'].forEach(function(sourceAttr) {
                var destAttr = sourceAttr.replace(/Date/, '');
                attrs.$observe(sourceAttr, function(val) {
                  val && element.attr(destAttr, moment(val).format('YYYY-MM-DD'));
                });
              });

              if (!angular.isArray(require)) {
                controllers = [controller];
                requires = [require];
              }
              var index = requires.indexOf('ngModel');
              if (index === -1) {
                throw 'We expect bsDatepickerDirective to require ngModel';
              }
              ngModel = controllers[index];

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
