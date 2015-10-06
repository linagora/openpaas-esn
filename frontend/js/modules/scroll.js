'use strict';

angular.module('esn.scroll', [])
  .constant('SCROLL_EVENTS', {
    RESET_SCROLL: 'scroll:reset'
  })
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
  .directive('scrollListener', function() {
    function link(scope) {
      if (scope.disabled) {
        return;
      }
      var position = $(window).scrollTop();
      var toggled = false;
      $(window).scroll(function(event) {
        var scroll = $(window).scrollTop();
        if (scroll > position && !toggled) {
          toggled = true;
          scope.onScrollDown();
        } else if (scroll < position && toggled) {
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
  });
