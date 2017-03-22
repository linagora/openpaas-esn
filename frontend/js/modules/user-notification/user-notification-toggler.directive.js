(function() {
  'use strict';

  angular.module('esn.user-notification')
    .directive('esnUserNotificationToggler', esnUserNotificationToggler);

  function esnUserNotificationToggler($popover) {
    return {
      link: link,
      restrict: 'E',
      replace: true,
      scope: true,
      templateUrl: '/views/modules/user-notification/user-notification-toggler.html'
    };

    function link(scope, element) {
      scope.togglePopover = function() {
        if (!scope.popover) {
          scope.popover = $popover(element, {
            scope: scope,
            trigger: 'manual',
            placement: 'bottom',
            templateUrl: '/views/modules/user-notification/user-notification.html'
          });
          scope.popover.$promise.then(scope.popover.show);
        } else {
          scope.popover.hide();
          scope.popover.destroy();
          scope.popover = null;
        }
      };
    }
  }
})();
