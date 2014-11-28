'use strict';

angular.module('esn.injection', [])
  .directive('injectionsWidget', function($compile) {
    return {
      restrict: 'E',
      scope: {
        injectionSubject: '=',
        injectionAnchorId: '@'
      },
      link: function(scope, element) {
        var buildHtmlFromInjectionData = function(injectionData) {
          var attributes = {class: 'injection'};
          if (injectionData.attributes) {
            injectionData.attributes.forEach(function(attribute) {
              attributes[attribute.name] = attribute.value;
            });
          }
          var e = $('<' + injectionData.directive + '/>');
          e.attr(attributes);
          return e;
        };

        element.hide();
        if (!scope.injectionAnchorId || !scope.injectionSubject || !scope.injectionSubject.injections) {
          return;
        }
        var thisAnchorInjections = scope.injectionSubject.injections.filter(function(injection) {
          return injection.key === scope.injectionAnchorId;
        });
        if (thisAnchorInjections.length === 0) {
          return;
        }
        else {
          thisAnchorInjections.forEach(function(injection) {
            injection.values.forEach(function(injectionData) {
              var template = angular.element(buildHtmlFromInjectionData(injectionData));
              var newElt = $compile(template)(scope);
              element.append(newElt);
            });
          });
          element.show();
        }
      }
    };
  });
