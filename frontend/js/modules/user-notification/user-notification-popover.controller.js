(function() {
  'use strict';

  angular.module('esn.user-notification')
    .controller('ESNUserNotificationPopoverController', ESNUserNotificationPopoverController);

    function ESNUserNotificationPopoverController(
      $scope,
      paginator,
      esnUserNotificationService,
      ESN_USER_NOTIFICATION_LIMIT_PAGER,
      ESN_USER_NOTIFICATION_OFFSET_START
    ) {
      $scope.loading = false;
      $scope.error = false;
      $scope.notificationsCache = [];
      $scope.notifications = [];
      $scope.totalNotifications = 0;
      $scope.display = false;

      function updateData(err, items, page) {
        if (err) {
          $scope.error = true;
        } else {
          if (items) {
            $scope.notifications = items;
            var unreadItems = items.filter(function(item) {
              return !item.read;
            });

            if (unreadItems.length) {
              $scope.$emit('usernotifications:received', unreadItems);
              $scope.notifications.forEach(function(notification) {
                notification.read = true;
              });
            }
          }
          $scope.currentPageNb = page;
        }
      }

      $scope.initPager = function(nbItemsPerPage) {
        (function(offset, limit, callback) {
          var options = {limit: limit, offset: offset};
          var loader = {
            getItems: function(items, offset, limit, callback) {
              return callback(null, items.slice(offset, offset + limit));
            },
            loadNextItems: function(callback) {
              $scope.loading = true;
              offset += limit;

              var newOptions = {limit: limit, offset: offset};

              esnUserNotificationService.list(newOptions).then(function(response) {
                return callback(null, response.data);
              }, function(err) {
                return callback(err);
              }).finally(function() {
                $scope.loading = false;
              });
            }
          };

          $scope.error = false;
          $scope.loading = true;
          esnUserNotificationService.list(options).then(function(response) {
            $scope.pager = paginator(response.data, nbItemsPerPage, response.headers('X-ESN-Items-Count'), loader);

            return callback(null);
          }, function(err) {
            return callback(err);
          }).finally(function() {
            $scope.loading = false;
          });
        })(ESN_USER_NOTIFICATION_OFFSET_START, ESN_USER_NOTIFICATION_LIMIT_PAGER, function(err) {
          if (err) {
            $scope.error = true;

            return;
          }
          $scope.totalNotifications = $scope.pager.getTotalItems();
          $scope.lastPageNb = $scope.pager.getLastPage();
          $scope.pager.currentPage(updateData);
        });
      };

      $scope.nextPage = function() {
        return $scope.pager.nextPage(updateData);
      };

      $scope.previousPage = function() {
        return $scope.pager.previousPage(updateData);
      };
    }
})();
