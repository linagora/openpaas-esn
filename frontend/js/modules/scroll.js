'use strict';

angular.module('esn.scroll', [])
  .constant('SCROLL_EVENTS', {
    RESET_SCROLL: 'scroll:reset'
  })
  .constant('SCROLL_DIFF_DELTA', 5) // in px
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
  .directive('scrollListener', function(SCROLL_DIFF_DELTA) {
    function link(scope) {
      var position = $(window).scrollTop();
      var toggled = false;
      $(window).scroll(function(event) {
        if (scope.disabled) {
          return;
        }
        var scroll = $(window).scrollTop();
        var diff = scroll - position;
        if (diff > 0 && !toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
          toggled = true;
          scope.onScrollDown();
        } else if (diff < 0 && toggled && Math.abs(diff) > SCROLL_DIFF_DELTA) {
          toggled = false;
          scope.onScrollUp();
        }
        position = scroll;
      });
    }

    return {
      restrict: 'A',
      scope: {
        onScrollDown: '=',
        onScrollUp: '=',
        disabled: '=?'
      },
      link: link
    };
  })
  .directive('resizeScrollbar', function() {
    return {
      restrict: 'A',
      link: function(scope, element) {
        scope.$on('nicescroll:resize', function() {
          element.getNiceScroll().resize();
        });
      }
    };
  })

  .factory('elementScrollService', function($timeout) {
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

    return {
      autoScrollDown: autoScrollDown
    };
  });
