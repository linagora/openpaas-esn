(function() {
'use strict';

angular.module('esn.onscroll')
  .directive('onScroll', onScroll);

  function onScroll($window) {
    return function(scope, element, attrs) {
      element.bind('DOMMouseScroll mousewheel onmousewheel', function(event) {
        scope.prevented = scope.prevented || false;

        // cross-browser wheel delta
        event = $window.event || event; // old IE support
        var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

        if (delta < 0) {
          scope.$apply(function() {
            scope.$eval(attrs.onScrollDown);
          });
        } else if (delta > 0) {
          scope.$apply(function() {
            scope.$eval(attrs.onScrollUp);
          });
        }

        if (event.preventDefault && scope.prevented) {
          // for IE
          event.returnValue = false;
          // for Chrome and Firefox
          event.preventDefault();
        }
      });
    };
  }
})();
