'use strict';

/* global interact: false */

angular.module('esn.swipe', [])
  .factory('interact', function() {
    return interact;
  })

  .directive('swipe', function($window, $http, $compile, $templateCache, $timeout, $modal, deviceDetector, interact) {
    return {
      restrict: 'AC',
      link: function(scope, element, attrs, controller) {
        if (deviceDetector.isDesktop()) {
          //return;
        }

        var parent = element.parent();
        var positionX = 0;
        var swipeWidth;
        var optionRight;
        var optionLeft;
        var optionItemRightWidth;
        var optionItemLeftWidth;
        var icons;
        var iconLeft;
        var iconRight;
        var maxDistanceForIconScale;
        var functionNoop = function() {};
        var stopClickPropagation = function(event) {
          event.stopImmediatePropagation();
        };
        var stopClickPropagationOnMove = functionNoop;
        var swipeLeft = functionNoop;
        var swipeRight = functionNoop;

        scope.swipeClose = function() {
          updateTranslate3dX(0);
        };

        scope.swipeLeft = function() {
          updateTranslate3dX(-swipeWidth);
        };

        scope.swipeRight = function() {
          updateTranslate3dX(swipeWidth);
        };

        if (attrs.swipeLeft) {
          swipeLeft = scope[attrs.swipeLeft];
        }
        if (attrs.swipeRight) {
          swipeRight = scope[attrs.swipeRight];
        }

        function init() {
          swipeWidth = element.outerWidth();
          maxDistanceForIconScale = swipeWidth / 4.0;
        }
        init();

        function isItemAtLeft(event) {
          return positionX + event.dx < 0;
        }

        function putInFrontOf(aheadElement, behindElement) {
          aheadElement.addClass('ahead').removeClass('behind');
          behindElement.removeClass('ahead').addClass('behind');
        }

        // Wrapper function for easy mock in tests
        scope.changeCss = function(element, property, value) {
          if (property === 'transform') {
            element.css('-webkit-transform', value);
          }
          element.css(property, value);
        };

        function updateTranslate3dX(x) {
          scope.changeCss(element, 'transform', buildTranslate3d(x, 0, 0));
          positionX = x;
        }

        function buildTranslate3d(x, y, z) {
          return 'translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)';
        }

        function buildScale3d(x, y, z) {
          return 'scale3d(' + x + ', ' + y + ', ' + z + ')';
        }

        function onStartListener(event) {
          element.addClass('moving');
          stopClickPropagationOnMove = stopClickPropagation;
        }

        function onMoveListener(event) {
          if (isItemAtLeft(event)) {
            putInFrontOf(optionRight, optionLeft);
          } else {
            putInFrontOf(optionLeft, optionRight);
          }
          updateTranslate3dX(positionX + event.dx);
          var positionXAbs = Math.abs(positionX);
          if (positionXAbs < maxDistanceForIconScale) {
            var scale = positionXAbs / maxDistanceForIconScale;
            scope.changeCss(icons, 'transform', buildScale3d(scale, scale, 1));
          }
        }

        function onEndListener(event) {
          element.removeClass('moving');
          $timeout(function() {
            stopClickPropagationOnMove = functionNoop;
          }, 200);

          if (isItemAtLeft(event)) {
            if (event.dx < 0 && Math.abs(event.dx) > swipeWidth / 3.0) {
              scope.swipeLeft();
              swipeLeft();
            } else {
              scope.swipeClose();
            }
          } else {
            if (event.dx > 0 && Math.abs(event.dx) > swipeWidth / 3.0) {
              scope.swipeRight();
              swipeRight();
            } else {
              scope.swipeClose();
            }
          }
        }

        angular.element($window).resize(function() {
          scope.swipeClose();
          init();
        });

        interact(element[0]).draggable({
          onmove: onMoveListener,
          onend: onEndListener,
          onstart: onStartListener
        }).on('click', function(event) {
          stopClickPropagationOnMove(event);
        }, true).on('tap', function(event) {
          if (attrs.ngClick) {
            scope.$evalAsync(attrs.ngClick);
          }
        });


        parent.addClass('swipe-wrapper');
        $http.get('/views/modules/swipe/swipe-options.html', {cache: $templateCache}).success(function(template) {
          parent.append($compile(template)(scope));
          optionLeft = parent.find('.option.left');
          optionRight = parent.find('.option.right');
          optionItemRightWidth = optionRight.find('.option-item').width();
          optionItemLeftWidth = optionLeft.find('.option-item').width();
          icons = parent.find('.option-item i');
          iconLeft = parent.find('.option.left .option-item i');
          iconRight = parent.find('.option.right .option-item i');

          if (attrs.iconLeft) {
            iconLeft.removeClass('mdi-apps');
            iconLeft.addClass(attrs.iconLeft);
          }
          if (attrs.iconRight) {
            iconRight.removeClass('mdi-apps');
            iconRight.addClass(attrs.iconRight);
          }
        });
      }
    };
  });
