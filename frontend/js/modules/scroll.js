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

  .factory('esnScrollListenerService', function() {
    var elements = [];

    return {
      bindTo: bindTo,
      getAllBoundSelectors: getAllBoundSelectors
    };

    /////

    function bindTo(selector) {
      elements.push(selector);
    }

    function getAllBoundSelectors() {
      return elements;
    }
  })

  .directive('scrollListener', function($parse, esnScrollListenerService, _, SCROLL_DIFF_DELTA) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, element, attrs) {
        var position = 0,
            toggled = false;

        var scrollHandler = function(event) {
          var $target = angular.element(event.target),
              elements = [document].concat(esnScrollListenerService.getAllBoundSelectors()),
              targetIsElement = function(element) { return $target.is(element); };

          if (!_.any(elements, targetIsElement)) {
            return;
          }

          var scroll = $target.scrollTop(),
              diff = scroll - position,
              locals = {
                $scroll: scroll
              };

          if (diff > 0 && !toggled && scroll > SCROLL_DIFF_DELTA) {
            toggled = true;
            $parse(attrs.onScrollDown)(scope, locals);
          } else if (diff < 0 && toggled) {
            toggled = false;
            $parse(attrs.onScrollUp)(scope, locals);
          }

          if (scroll === 0 && attrs.onScrollTop) {
            $parse(attrs.onScrollTop)(scope, locals);
          }

          position = scroll;
        };

        document.addEventListener('scroll', scrollHandler, true);

        scope.$on('$destroy', function() {
          document.removeEventListener('scroll', scrollHandler, true);
          $parse(attrs.onDestroy)(scope);
        });
      }
    };
  })

  .factory('elementScrollService', function($timeout, $window, esnScrollListenerService, subHeaderService, deviceDetector, ESN_SUBHEADER_HEIGHT_MD) {
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
        scrollY -= ESN_SUBHEADER_HEIGHT_MD;
      }

      $window.scrollTo(0, 0);
      $window.scrollTo(0, scrollY);
    }

    function scrollToTop() {
      ['html, body'].concat(esnScrollListenerService.getAllBoundSelectors()).forEach(function(element) {
        angular.element(element).animate({ scrollTop: 0 }, deviceDetector.isMobile() ? 0 : 250);
      });
    }

    return {
      autoScrollDown: autoScrollDown,
      scrollDownToElement: scrollDownToElement,
      scrollToTop: scrollToTop
    };
  })

  .directive('scrollTopOnClick', function(elementScrollService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        element.on('click', elementScrollService.scrollToTop);
      }
    };
  });
