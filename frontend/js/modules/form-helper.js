'use strict';

angular.module('esn.form.helper', [])
.directive('esnTrackFirstBlur', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, controller) {
      elem.one('blur', function() {
        controller._blur = true;
        scope.$digest();
      });
    }
  };
})
.directive('passwordMatch', function() {
  return {
    restrict: 'A',
    scope: true,
    require: 'ngModel',
    link: function(scope, elem , attrs, control) {
      var checker = function() {
        var e1 = scope.$eval(attrs.ngModel);
        var e2 = scope.$eval(attrs.passwordMatch);
        return e1 === e2;
      };
      scope.$watch(checker, function(n) {
        control.$setValidity('unique', n);
      });
    }
  };
});
