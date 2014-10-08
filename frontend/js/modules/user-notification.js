'use strict';

angular.module('esn.user-notification', ['restangular', 'esn.paginate'])
  .constant('SCREEN_SM_MIN', 768)
  .constant('USER_NOTIFICATION_ITEM_HEIGHT', 50)
  .constant('MOBILE_BROWSER_URL_BAR', 56)
  .constant('POPOVER_ARROW_HEIGHT', 10)
  .constant('POPOVER_TITLE_HEIGHT', 35)
  .constant('POPOVER_PAGER_BUTTONS_HEIGHT', 30)
  .constant('BOTTOM_PADDING', 5)
  .controller('userNotificationController', ['$scope', '$log', 'userNotificationAPI', function($scope, $log, userNotificationAPI) {
    // TODO resolve readCount with getList here or in app.js
    $scope.readCount = 42;

    $scope.setAsRead = function(id) {
      $scope.readCount--;
      userNotificationAPI
        .setRead(id, true)
        .then(function(response) {
          $log.info('Successfully setting ' + id + ' as read');
        }, function(err) {
          $log.error('Error setting ' + id + ' as read: ' + err);
        });
    };
  }])
  .controller('userNotificationPopoverController', ['$scope', 'userNotificationAPI', 'paginator', function($scope, userNotificationAPI, paginator) {

    $scope.loading = false;
    $scope.error = false;
    $scope.notifications = [];
    $scope.totalNotifications = 0;
    $scope.display = false;
    $scope.popoverObject = {
      open: false
    };

    $scope.togglePopover = function() {
      $scope.popoverObject.open = !$scope.popoverObject.open;
    };

    $scope.updateData = function(err, items, total, page) {
      if (err) {
        $scope.error = true;
      } else {
        if (items) {
          $scope.notifications = items;
        }
        if (total) {
          $scope.totalNotifications = total;
        }
        $scope.currentPageNb = page + 1;
        $scope.lastPageNb = Math.ceil($scope.totalNotifications / (items.length || 1));
      }
    };

    $scope.initPager = function(nbItemsPerPage) {
      $scope.pager = paginator(nbItemsPerPage, {
        getItems: function(offset, limit, callback) {
          $scope.error = false;
          var options = {limit: limit, offset: offset, read: false};
          $scope.loading = true;
          userNotificationAPI.list(options).then(function(response) {
            return callback(null, response.data, response.headers('X-ESN-Items-Count'));
          }, function(err) {
            return callback(err);
          }).finally (function() {
            $scope.loading = false;
          });
        }
      });
      $scope.pager.currentPage($scope.updateData);
    };

    $scope.nextPage = function() {
      return $scope.pager.nextPage($scope.updateData);
    };

    $scope.previousPage = function() {
      return $scope.pager.previousPage($scope.updateData);
    };
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
  ['$timeout', '$window', 'SCREEN_SM_MIN', 'USER_NOTIFICATION_ITEM_HEIGHT', 'MOBILE_BROWSER_URL_BAR', 'POPOVER_ARROW_HEIGHT', 'POPOVER_TITLE_HEIGHT', 'POPOVER_PAGER_BUTTONS_HEIGHT', 'BOTTOM_PADDING',
    function($timeout, $window, SCREEN_SM_MIN, USER_NOTIFICATION_ITEM_HEIGHT, MOBILE_BROWSER_URL_BAR, POPOVER_ARROW_HEIGHT, POPOVER_TITLE_HEIGHT, POPOVER_PAGER_BUTTONS_HEIGHT, BOTTOM_PADDING) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {

          var loaded = false;
          function hidePopover() {
            if (scope.$hide) {
              loaded = false;
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
      };
    }])
    .factory('userNotificationAPI', ['Restangular', function(Restangular) {
      function list(options) {
        return Restangular.one('user').all('notifications').getList(options);
      }

      function setRead(id, read) {
        return Restangular.one('user').one('notifications', id).one('read').customPUT({value: read});
      }

      function setAcknowledgeded(id, acknowledgeded) {
        return Restangular.one('user').one('notifications', id).one('acknowledgeded').customPUT({value: acknowledgeded});
      }

      function getUnreadCount() {
        return Restangular.one('user').one('notifications').one('unread').get();
      }

      return {
        list: list,
        setRead: setRead,
        setAcknowledgeded: setAcknowledgeded,
        getUnreadCount: getUnreadCount
      };
    }]);
