'use strict';

angular.module('esn.scroll', ['esn.header', 'ng.deviceDetector'])
  .constant('SCROLL_EVENTS', {
    RESET_SCROLL: 'scroll:reset'
  })
  .constant('SCROLL_DIFF_DELTA', 30) // in px
  .directive('keepScrollPosition', function($log, SCROLL_EVENTS, $cacheFactory, $location, $document, $timeout) {
    var CACHE_KEY = 'scrollPosition';

    return {
      restrict: 'A',
      link: function(scope) {
        var scrollPositionCache = $cacheFactory.get(CACHE_KEY);
        if (!scrollPositionCache) {
          scrollPositionCache = $cacheFactory(CACHE_KEY);
        }
        var currentPath = $location.path();

        // store current scroll position before switch
        scope.$on('$locationChangeStart', function(event, next, current) {
          scrollPositionCache.put(currentPath, $document.scrollTop());
        });

        scope.$on(SCROLL_EVENTS.RESET_SCROLL, function() {
          scrollPositionCache.put(currentPath, 0);
        });

        // scroll to stored position
        scope.$on('viewRenderFinished', function() {
          var position = scrollPositionCache.get(currentPath) || 0;
          $log.debug('Scrolling to:', position);
          $timeout(function() {
            $document.scrollTop(position);
          });

        });
      }
    };
  })

  .directive('scrollListener', function($parse, SCROLL_DIFF_DELTA) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, element, attrs) {

        var position = angular.element(window).scrollTop(),
            toggled = false;

        var scrollHandler = function() {
          var scroll = angular.element(window).scrollTop();
          var diff = scroll - position;
          if (diff > 0 && !toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
            toggled = true;
            $parse(scope[attrs.onScrollDown])();
          } else if (diff < 0 && toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
            toggled = false;
            $parse(scope[attrs.onScrollUp])();
          }

          if (scroll === 0 && attrs.onScrollTop) {
            $parse(scope[attrs.onScrollTop])();
          }

          position = scroll;
        };

        angular.element(window).scroll(scrollHandler);

        scope.$on('$destroy', function() {
          angular.element(window).off('scroll', scrollHandler);
          $parse(scope[attrs.onDestroy])();
        });
      }
    };
  })

  .factory('elementScrollService', function($timeout, $window, subHeaderService, deviceDetector, SUB_HEADER_HEIGHT_IN_PX) {
    /**
     * Auto-scroll to the end of the given element
     * @param element
     */
    function autoScrollDown(element) {
      if (!!element && !!element[0]) {
        $timeout(function() {
          element.scrollTop(element[0].scrollHeight);
        }, 0);
      }
    }

    function scrollDownToElement(element) {
      var scrollY = element.offset().top;

      if (subHeaderService.isVisible()) {
        scrollY -= SUB_HEADER_HEIGHT_IN_PX;
      }

      $window.scrollTo(0, 0);
      $window.scrollTo(0, scrollY);
    }

    function scrollToTop() {
      if (deviceDetector.isMobile()) {
        // the animation rendering is often bad with mobiles
        $window.scrollTo(0, 0);
      } else {
        angular.element('html, body').animate({ scrollTop: 0 });
      }
    }

    return {
      autoScrollDown: autoScrollDown,
      scrollDownToElement: scrollDownToElement,
      scrollToTop: scrollToTop
    };
  });
