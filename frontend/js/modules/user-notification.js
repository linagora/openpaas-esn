'use strict';

angular.module('esn.user-notification', ['restangular'])
  .constant('SCREEN_SM_MIN', 768)
  .constant('USER_NOTIFICATION_ITEM_HEIGHT', 50)
  .constant('MOBILE_BROWSER_URL_BAR', 56)
  .constant('POPOVER_ARROW_HEIGHT', 10)
  .constant('POPOVER_TITLE_HEIGHT', 35)
  .constant('POPOVER_PAGER_BUTTONS_HEIGHT', 30)
  .constant('BOTTOM_PADDING', 5)


  .factory('userNotificationCache', function($q) {
    var defer = $q.defer();
    return {
      setItemSize: function(size) {
        defer.resolve(size);
        // for next time...
        defer = $q.defer();
      },
      getItemSize: function() {
        return defer.promise;
      }
    };
  })

  .controller('userNotificationController', ['$scope', 'userNotificationAPI', 'userNotificationCache', function($scope, userNotificationAPI, userNotificationCache) {
    $scope.loading = false;
    $scope.error = false;
    $scope.notifications = [];
    $scope.totalNotifications = 0;
    $scope.offset = 0;
    $scope.notificationsPerPage = 5;

    $scope.popoverObject = {
      open: false
    };

    $scope.pagination = {
      current: 1,
      last: 0
    };

    $scope.reset = function() {
      $scope.notifications = [];
      $scope.pagination = {
        current: 1,
        last: 0
      };
      $scope.notificationsPerPage = 5;
    };

    $scope.togglePopover = function() {
      console.log('Toggle popover in userNotificationController');

      $scope.popoverObject.open = !$scope.popoverObject.open;
      if (!$scope.popoverObject.open) {
        $scope.reset();
      } else {
        userNotificationCache.getItemSize().then(function(data) {
          console.log('Got promise result');
          $scope.notificationsPerPage = data;
          $scope.load();
        });
      }
    };

    $scope.nextPage = function() {
      if ($scope.pagination.current === $scope.pagination.last) {
        return;
      }
      $scope.load($scope.pagination.current + 1);
    };

    $scope.previousPage = function() {
      if ($scope.pagination.current === 1) {
        return;
      }
      $scope.load($scope.pagination.current - 1);
    };

    $scope.load = function(pageToLoad) {
      pageToLoad = pageToLoad || 1;

      var options = {limit: $scope.notificationsPerPage, offset: (pageToLoad - 1) * $scope.notificationsPerPage, read: false};
      $scope.loading = true;

      userNotificationAPI.list(options).then(function(response) {
        $scope.notifications = response.data;
        $scope.totalNotifications = response.headers('X-ESN-Items-Count');

        // TODO : Change the current page according to the pagination.last value and total notifications
        $scope.pagination.current = pageToLoad;
        $scope.pagination.last = Math.ceil($scope.totalNotifications / $scope.notificationsPerPage);
      }, function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    };

    /*
    $scope.$on('notification:load', function(event, data) {
      if (!$scope.notifications.length) {
        $scope.notificationsPerPage = data;
        $scope.load();
      }
    });
    */
  }])
  .directive('notificationTemplateDisplayer', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/notificationTemplateDisplayer.html'
    };
  })
  .directive('infoNotification', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/info-notification.html'
    };
  })
  .directive('userNotificationPopover',
  ['$timeout', '$window', 'userNotificationCache', 'SCREEN_SM_MIN', 'USER_NOTIFICATION_ITEM_HEIGHT', 'MOBILE_BROWSER_URL_BAR', 'POPOVER_ARROW_HEIGHT', 'POPOVER_TITLE_HEIGHT', 'POPOVER_PAGER_BUTTONS_HEIGHT', 'BOTTOM_PADDING',
    function($timeout, $window, userNotificationCache, SCREEN_SM_MIN, USER_NOTIFICATION_ITEM_HEIGHT, MOBILE_BROWSER_URL_BAR, POPOVER_ARROW_HEIGHT, POPOVER_TITLE_HEIGHT, POPOVER_PAGER_BUTTONS_HEIGHT, BOTTOM_PADDING) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          function hidePopover() {
            if (scope.$hide) {
              scope.popoverObject.open = false;
              scope.$hide();
              scope.$apply();
            }
          }

          $timeout(function() {
            element.on('click', function(event) {
              event.stopPropagation();
            });

            angular.element('body').on('click', hidePopover);
          }, 0);

          // page height - url bar (mobile browser) - 1er topbar - 2e topbar - padding arrow - popover title - button next previous - bottom padding
          var popoverMaxHeight = $window.innerHeight - MOBILE_BROWSER_URL_BAR -
            angular.element('.topbar').height() - angular.element('.esn-navbar-wrapper').height() -
            POPOVER_ARROW_HEIGHT - POPOVER_TITLE_HEIGHT - POPOVER_PAGER_BUTTONS_HEIGHT - BOTTOM_PADDING;

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

              if (width >= SCREEN_SM_MIN) {
                element.width(600);
                nbItems = 5;
              } else {
                element.width(width - 10);
                nbItems = Math.floor(popoverMaxHeight / USER_NOTIFICATION_ITEM_HEIGHT);
              }

              console.log('Set item from directive')
              userNotificationCache.setItemSize(nbItems);
              //scope.$emit('notification:load', nbItems);
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
      };
    }])
    .factory('userNotificationAPI', ['Restangular', function(Restangular) {
      function list(options) {
        return Restangular.one('user').all('notifications').getList(options);
      }

      return {
        list: list
      };
    }]);
