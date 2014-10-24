'use strict';

angular.module('esn.user-notification',
  ['restangular', 'esn.paginate', 'esn.websocket', 'esn.core', 'esn.object-type', 'esn.session', 'esn.community'])
  .constant('SCREEN_SM_MIN', 768)
  .constant('USER_NOTIFICATION_ITEM_HEIGHT', 75)
  .constant('MOBILE_BROWSER_URL_BAR', 56)
  .constant('POPOVER_ARROW_HEIGHT', 10)
  .constant('POPOVER_TITLE_HEIGHT', 35)
  .constant('POPOVER_PAGER_BUTTONS_HEIGHT', 30)
  .constant('BOTTOM_PADDING', 5)
  .constant('UNREAD_REFRESH_TIMER', 10 * 1000)
  .constant('OFFSET_START', 0)
  .constant('LIMIT_PAGER', 25)
  .controller('userNotificationController', [
    '$scope',
    '$log',
    '$timeout',
    'userNotificationAPI',
    'userNotificationCounter',
    'livenotification',
    function($scope, $log, $timeout, userNotificationAPI, userNotificationCounter, livenotification) {
      $scope.unreadCount = userNotificationCounter;
      $scope.unreadCount.init();

      $scope.setAsRead = function(id) {
        $scope.unreadCount.decreaseBy(1);
        userNotificationAPI
          .setRead(id, true)
          .then(function() {
            $log.debug('Successfully setting ' + id + ' as read');
          }, function(err) {
            $log.error('Error setting ' + id + ' as read: ' + err);
          })
          .finally (function() {
            $scope.unreadCount.refresh();
          });
      };

      $scope.setAllAsRead = function(ids) {
        $scope.unreadCount.decreaseBy(ids.length);
        userNotificationAPI
          .setAllRead(ids, true)
          .then(function() {
            $log.debug('Successfully setting ' + ids.toString() + ' as read');
          }, function(err) {
            $log.error('Error setting ' + ids.toString() + ' as read: ' + err);
          })
          .finally (function() {
          $scope.unreadCount.refresh();
        });
      };

      $scope.$on('usernotifications:received', function(event, usernotifications) {
        var ids = usernotifications.map(function(usernotification) {
          return usernotification._id;
        });
        $scope.setAllAsRead(ids);
      });

      livenotification('/usernotification').on('usernotification:created', $scope.unreadCount.refresh);
      $scope.$on('$destroy', function() {
        livenotification('/usernotification').removeListener('usernotification:created', $scope.unreadCount.refresh);
      });
    }
  ])
  .controller('userNotificationPopoverController', [
    '$scope',
    'userNotificationAPI',
    'paginator',
    'OFFSET_START',
    'LIMIT_PAGER',
    function($scope, userNotificationAPI, paginator, OFFSET_START, LIMIT_PAGER) {

      $scope.loading = false;
      $scope.error = false;
      $scope.notificationsCache = [];
      $scope.notifications = [];
      $scope.totalNotifications = 0;
      $scope.display = false;
      $scope.popoverObject = {
        open: false
      };

      $scope.togglePopover = function() {
        $scope.popoverObject.open = !$scope.popoverObject.open;
      };

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
              userNotificationAPI.list(newOptions).then(function(response) {
                return callback(null, response.data);
              }, function(err) {
                return callback(err);
              }).finally (function() {
                $scope.loading = false;
              });
            }
          };
          $scope.error = false;
          $scope.loading = true;
          userNotificationAPI.list(options).then(function(response) {
            $scope.pager = paginator(response.data, nbItemsPerPage, response.headers('X-ESN-Items-Count'), loader);
            return callback(null);
          }, function(err) {
            return callback(err);
          }).finally (function() {
            $scope.loading = false;
          });
        }) (OFFSET_START, LIMIT_PAGER, function(err) {
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
  ])
  .directive('notificationTemplateDisplayer', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/notification-template-displayer.html'
    };
  })
  .directive('externalUserNotification', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/external-notification.html'
    };
  })
  .directive('communityMembershipInvitationNotification', ['objectTypeResolver', '$q', 'session', function(objectTypeResolver, $q, session) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/community-membership-invitation-notification.html',
      controller: function($scope) {
        var userResolver = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
        var communityResolver = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);

        $scope.invitedUser = session.user;
        $scope.error = false;

        $q.all({user: userResolver, community: communityResolver}).then(function(result) {
          $scope.invitationSender = result.user.data;
          $scope.invitationCommunity = result.community.data;
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.loading = false;
        });
      }
    };
  }])
  .directive('communityInvitationAcceptButton', ['communityAPI', 'userNotificationAPI',
    function(communityAPI, userNotificationAPI) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/user-notification/community-invitation/community-invitation-accept-button.html',
      controller: function($scope) {
        $scope.restActive = false;
        $scope.accept = function() {
          $scope.restActive = true;
          communityAPI.join($scope.invitationCommunity._id, $scope.invitedUser._id).then(
            function() {
              userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
                function() {
                  $scope.notification.acknowledged = true;
                },
                function(error) {
                  $scope.error = error;
                }
              ).finally (function() {
                $scope.restActive = false;
              });
            },
            function(error) {
              $scope.error = error;
              $scope.restActive = false;
            }
          );
        };
      }
    };
  }])
  .directive('communityInvitationDeclineButton', ['communityAPI', 'session', 'userNotificationAPI',
    function(communityAPI, session, userNotificationAPI) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/user-notification/community-invitation/community-invitation-decline-button.html',
      controller: function($scope) {
        $scope.restActive = false;
        $scope.decline = function() {
          $scope.restActive = true;
          communityAPI.cancelRequestMembership($scope.invitationCommunity._id, session.user._id).then(
            function() {
              userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
                function() {
                  $scope.notification.acknowledged = true;
                },
                function(error) {
                  $scope.error = error;
                }
              ).finally (function() {
                $scope.restActive = false;
              });
            },
            function(error) {
              $scope.error = error;
              $scope.restActive = false;
            }
          );
        };
      }
    };
  }])
  .factory('userNotificationCounter', ['$log', 'CounterFactory', 'UNREAD_REFRESH_TIMER', 'userNotificationAPI', function($log, CounterFactory, UNREAD_REFRESH_TIMER, userNotificationAPI) {
    return new CounterFactory.newCounter(0, UNREAD_REFRESH_TIMER, userNotificationAPI.getUnreadCount);
  }])
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
      };
    }])
  .factory('userNotificationAPI', ['Restangular', function(Restangular) {
    function list(options) {
      return Restangular.one('user').all('notifications').getList(options);
    }

    function setRead(id, read) {
      return Restangular.one('user').one('notifications', id).one('read').customPUT({value: read});
    }

    function setAllRead(ids, read) {
      var request = Restangular.one('user').one('notifications').one('read');
      request.value = read;
      return request.put({ ids: ids });
    }

    function setAcknowledged(id, acknowledged) {
      return Restangular.one('user').one('notifications', id).one('acknowledged').customPUT({value: acknowledged});
    }

    function getUnreadCount() {
      return Restangular.one('user').one('notifications').one('unread').get();
    }

    return {
      list: list,
      setRead: setRead,
      setAllRead: setAllRead,
      setAcknowledged: setAcknowledged,
      getUnreadCount: getUnreadCount
    };
  }]);
