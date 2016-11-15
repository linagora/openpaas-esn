'use strict';

angular.module('esn.scroll', [
  'esn.constants',
  'esn.header',
  'ng.deviceDetector'
])

  .constant('SCROLL_EVENTS', {
    RESET_SCROLL: 'scroll:reset'
  })
  .constant('SCROLL_CACHE_KEY', 'scrollPosition')

  .directive('keepScrollPosition', function($cacheFactory, $location, $document, $timeout, SCROLL_EVENTS, SCROLL_CACHE_KEY) {
    var cache;

    return {
      restrict: 'A',
      link: function(scope) {
        var url = $location.absUrl();

        if (!cache) {
          cache = $cacheFactory(SCROLL_CACHE_KEY);
        }

        scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
          if (url === oldUrl) {
            cache.put(url, $document.scrollTop());
          }
        });

        scope.$on(SCROLL_EVENTS.RESET_SCROLL, function() {
          cache.put(url, 0);
        });

        scope.$on('$locationChangeSuccess', function(event, newUrl) {
          if (url === newUrl) {
            var position = cache.get(url) || 0;

            $timeout(function() {
              $document.scrollTop(position);
            }, 0, false);
          }
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
          var scroll = angular.element(window).scrollTop(),
              diff = scroll - position;

          if (diff > 0 && !toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
            toggled = true;
            $parse(attrs.onScrollDown)(scope);
          } else if (diff < 0 && toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
            toggled = false;
            $parse(attrs.onScrollUp)(scope);
          }

          if (scroll === 0 && attrs.onScrollTop) {
            $parse(attrs.onScrollTop)(scope);
          }

          position = scroll;
        };

        angular.element(window).scroll(scrollHandler);

        scope.$on('$destroy', function() {
          angular.element(window).off('scroll', scrollHandler);
          $parse(attrs.onDestroy)(scope);
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
