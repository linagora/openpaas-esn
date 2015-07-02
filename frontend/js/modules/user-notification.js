'use strict';

angular.module('esn.user-notification',
  ['restangular', 'esn.paginate', 'esn.websocket', 'esn.core', 'esn.object-type', 'esn.session', 'esn.collaboration'])
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
  .controller('userNotificationController', function($scope, $log, $timeout, userNotificationAPI, userNotificationCounter, livenotification) {
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

      function onUserNotificationCreated() {
        $scope.unreadCount.increaseBy(1);
        $scope.unreadCount.refresh();
      }

      livenotification('/usernotification').on('usernotification:created', onUserNotificationCreated);
      $scope.$on('$destroy', function() {
        livenotification('/usernotification').removeListener('usernotification:created', onUserNotificationCreated);
      });
    })
  .directive('userNotificationButton', function($popover) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/user-notification/user-notification-button.html',
      scope: true,
      link: function($scope, $element) {

        $scope.togglePopover = function() {
          if (!$scope.popover) {
            $scope.popover = $popover($element, {
                scope: $scope,
                trigger: 'manual',
                placement: 'bottom-left',
                template: '/views/modules/user-notification/user-notification.html'
              }
            );
            $scope.popover.$promise.then($scope.popover.show);

          } else {
            $scope.popover.hide();
            $scope.popover.destroy();
            $scope.popover = null;
          }
        };
      }
    };
  })
  .controller('userNotificationPopoverController', function($scope, userNotificationAPI, paginator, OFFSET_START, LIMIT_PAGER) {

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
    })
  .controller('requestMembershipActionNotificationController', function($scope, objectTypeResolver, userNotificationAPI) {
    $scope.error = false;
    $scope.loading = true;
    objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id)
      .then(function(result) {
        $scope.collaboration = result.data;
        $scope.collaboration.objectType = $scope.notification.complement.objectType;
        $scope.collaborationPath = $scope.notification.complement.objectType === 'community' ? 'communities' : 'projects';

        userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
          function() {
            $scope.notification.acknowledged = true;
          },
          function(error) {
            $scope.error = error;
          }
        ).finally (function() {
          $scope.loading = false;
        });

      }, function() {
        $scope.error = true;
      }).finally (function() {
      $scope.loading = false;
    });
  })
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
  .directive('externalUserNotification', function(objectTypeResolver, $q, userNotificationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/external-notification.html',
      controller: function($scope) {
        var acknowledging = false;

        $scope.acknowledge = function() {
          if (acknowledging) {
            return;
          }
          acknowledging = true;
          userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
            function() {
              $scope.notification.acknowledged = true;
            },
            function(error) {
              $scope.error = error;
            }
          );
        };

        var resolvers = {};

        resolvers.subject = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
        if ($scope.notification.complement) {
          resolvers.complement = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);
        }
        if ($scope.notification.context) {
          resolvers.context = objectTypeResolver.resolve($scope.notification.context.objectType, $scope.notification.context.id);
        }

        this.actionDone = function(action) {
          $scope.actionDone = action;
        };

        $scope.error = false;

        $q.all(resolvers).then(function(result) {
          if (result.subject && result.subject.data) {
            $scope.subject = {
              url: result.subject.data.url(result.subject.data),
              avatarUrl: result.subject.data.avatarUrl(result.subject.data),
              displayName: result.subject.data.displayName(result.subject.data)
            };
          } else {
            $scope.subject = result.subject;
          }
          if (result.context && result.context.data) {
            $scope.context = {
              url: result.context.data.url(result.context.data),
              avatarUrl: result.context.data.avatarUrl(result.context.data),
              displayName: result.context.data.displayName(result.context.data)
            };
          } else {
            $scope.context = result.context;
          }
          $scope.verb = $scope.notification.verb.text;
          if (result.complement && result.complement.data) {
            $scope.complement = {
              url: result.complement.data.url(result.complement.data),
              avatarUrl: result.complement.data.avatarUrl(result.complement.data),
              displayName: result.complement.data.displayName(result.complement.data)
            };
          } else {
            $scope.complement = result.complement;
          }
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.loading = false;
        });
      }
    };
  })
  .directive('collaborationMembershipInvitationNotification', function(objectTypeResolver, $q, session) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/collaboration-membership-invitation-notification.html',
      controller: function($scope) {
        var userResolver = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
        var collaborationResolver = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);

        this.actionDone = function(action) {
          $scope.notification.actionDone = action;
        };

        $scope.invitedUser = session.user;
        $scope.error = false;

        $q.all({user: userResolver, collaboration: collaborationResolver}).then(function(result) {
          $scope.invitationSender = result.user.data;
          $scope.invitationCollaboration = result.collaboration.data;
          $scope.invitationCollaboration.objectType = $scope.notification.complement.objectType;
          $scope.collaborationPath = $scope.notification.complement.objectType === 'community' ? 'communities' : 'projects';
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.loading = false;
        });
      }
    };
  })
  .directive('collaborationMembershipRequestAcceptedNotification', function(objectTypeResolver, $q, session) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/collaboration-membership-request-accepted-notification.html',
      controller: 'requestMembershipActionNotificationController'
    };
  })
  .directive('collaborationMembershipRequestDeclinedNotification', function(objectTypeResolver) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/collaboration-membership-request-declined-notification.html',
      controller: 'requestMembershipActionNotificationController'
    };
  })
  .directive('collaborationInvitationAcceptButton', function(collaborationAPI, userNotificationAPI) {
    return {
      restrict: 'E',
      require: '^collaborationMembershipInvitationNotification',
      templateUrl: '/views/modules/user-notification/collaboration-invitation/collaboration-invitation-accept-button.html',
      link: function($scope, element, attrs, invitationController) {
        $scope.restActive = false;
        $scope.accept = function() {
          $scope.restActive = true;
          collaborationAPI.join($scope.invitationCollaboration.objectType, $scope.invitationCollaboration._id, $scope.invitedUser._id).then(
            function() {
              userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
                function() {
                  $scope.notification.acknowledged = true;
                  invitationController.actionDone('accept');
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
  })
  .directive('collaborationInvitationDeclineButton', function(collaborationAPI, session, userNotificationAPI) {
    return {
      restrict: 'E',
      require: '^collaborationMembershipInvitationNotification',
      templateUrl: '/views/modules/user-notification/collaboration-invitation/collaboration-invitation-decline-button.html',
      link: function($scope, element, attrs, invitationController) {
        $scope.restActive = false;
        $scope.decline = function() {
          $scope.restActive = true;
          collaborationAPI.cancelRequestMembership($scope.invitationCollaboration.objectType, $scope.invitationCollaboration._id, session.user._id).then(
            function() {
              userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
                function() {
                  $scope.notification.acknowledged = true;
                  invitationController.actionDone('decline');
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
  })
  .directive('collaborationJoinNotification', function(objectTypeResolver, $q, userNotificationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/collaboration-join.html',
      controller: function($scope) {
        var userResolver = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
        var collaborationResolver = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);

        $scope.error = false;

        $q.all({user: userResolver, collaboration: collaborationResolver}).then(function(result) {
          $scope.joiner = result.user.data;
          $scope.collaborationJoined = result.collaboration.data;
          $scope.collaborationJoined.objectType = $scope.notification.complement.objectType;
          $scope.collaborationPath = $scope.notification.complement.objectType === 'community' ? 'communities' : 'projects';
          userNotificationAPI.setAcknowledged($scope.notification._id, true).then(
            function() {
              $scope.notification.acknowledged = true;
            },
            function(error) {
              $scope.error = error;
            }
          );
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.loading = false;
        });
      }
    };
  })
  .factory('userNotificationCounter', function($log, CounterFactory, UNREAD_REFRESH_TIMER, userNotificationAPI) {
    return new CounterFactory.newCounter(0, UNREAD_REFRESH_TIMER, userNotificationAPI.getUnreadCount);
  })
  .directive('userNotificationPopover',
  function($rootScope, $timeout, $window, SCREEN_SM_MIN, USER_NOTIFICATION_ITEM_HEIGHT, MOBILE_BROWSER_URL_BAR, POPOVER_ARROW_HEIGHT, POPOVER_TITLE_HEIGHT, POPOVER_PAGER_BUTTONS_HEIGHT, BOTTOM_PADDING) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {

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
    })
  .factory('userNotificationAPI', function(Restangular) {
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
  });
