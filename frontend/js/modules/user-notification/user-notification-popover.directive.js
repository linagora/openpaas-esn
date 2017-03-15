(function() {
  'use strict';

  angular.module('esn.user-notification')
    .directive('esnUserNotificationPopover', esnUserNotificationPopover);

  function esnUserNotificationPopover(
    $rootScope,
    $timeout,
    $window,
    ESN_USER_NOTIFICATION_BOTTOM_PADDING,
    ESN_USER_NOTIFICATION_MOBILE_BROWSER_URL_BAR,
    ESN_USER_NOTIFICATION_POPOVER_ARROW_HEIGHT,
    ESN_USER_NOTIFICATION_POPOVER_PAGER_BUTTONS_HEIGHT,
    ESN_USER_NOTIFICATION_POPOVER_TITLE_HEIGHT,
    ESN_USER_NOTIFICATION_SCREEN_SM_MIN,
    ESN_USER_NOTIFICATION_ITEM_HEIGHT
  ) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element) {
      var loaded = false;

      function hidePopover() {
        if (scope.$hide) {
          loaded = false;
          scope.togglePopover();
          scope.$hide();
          $rootScope.$apply();
        }
      }

      $timeout(function() {
        element.on('click', function(event) {
          event.stopPropagation();
        });

        angular.element('body').on('click', hidePopover);
      }, 0);

      // page height - url bar (mobile browser) - 1er topbar - 2e topbar - padding arrow - popover title - button next previous - bottom padding
      var popoverMaxHeight = $window.innerHeight - ESN_USER_NOTIFICATION_MOBILE_BROWSER_URL_BAR -
        angular.element('.topbar').height() - angular.element('.esn-navbar-wrapper').height() -
        ESN_USER_NOTIFICATION_POPOVER_ARROW_HEIGHT - ESN_USER_NOTIFICATION_POPOVER_TITLE_HEIGHT - ESN_USER_NOTIFICATION_POPOVER_PAGER_BUTTONS_HEIGHT - ESN_USER_NOTIFICATION_BOTTOM_PADDING;

      if (popoverMaxHeight < 0) {
        popoverMaxHeight = 0;
      }

      var isResizing = false;

      function onResize(timeout) {
        if (isResizing) {
          return;
        }
        isResizing = true;

        function doResize() {
          var nbItems;
          var width = ($window.innerWidth > $window.screen.availWidth) ? $window.outerWidth : $window.innerWidth;

          if (width >= ESN_USER_NOTIFICATION_SCREEN_SM_MIN) {
            element.width(600);
            nbItems = 5;
          } else {
            element.width(width - 10);
            nbItems = Math.floor(popoverMaxHeight / ESN_USER_NOTIFICATION_ITEM_HEIGHT);
            if (nbItems === 0) {
              nbItems = 1;
            }
          }

          if (!loaded) {
            scope.initPager(nbItems);
            loaded = true;
          }

          isResizing = false;
        }

        if (timeout !== 0) {
          $timeout(doResize, 100);
        } else {
          doResize();
        }
      }

      onResize(0);

      angular.element($window).on('resize', onResize);

      element.on('$destroy', function() {
        angular.element('body').off('click', hidePopover);
        element.off('click');
        angular.element($window).off('resize', onResize);
      });
    }
  }
})();
