'use strict';

angular.module('esn.notification', ['ui.notify', 'angularMoment'])
  .directive('infoNotification', ['livenotification', 'notificationService', '$timeout',
    function(livenotification, notificationService, $timeout) {
      return {
        restrict: 'E',
        controller: function() {
          this.addNotification = function(scope) {
            var stack_bottomright = {'dir1': 'up', 'dir2': 'left', 'push': 'top'};

            function handleNotification(msg) {
              notificationService.notify({
                title: scope.title(msg),
                text: scope.text(msg),
                nonblock: {
                  nonblock: true,
                  nonblock_opacity: 0.2
                },
                addclass: 'stack-bottomright',
                stack: stack_bottomright,
                type: 'info',
                delay: 3000,
                styling: 'fontawesome'
              });
              if (scope.callbackOnNotification) {
                scope.callbackOnNotification(msg);
              }
            }

            $timeout(function() {
              livenotification
                .of(scope.namespace)
                .subscribe(scope.room)
                .onNotification(function(msg) {
                  scope.conditionToDisplay = scope.conditionToDisplay || undefined;
                  if (scope.conditionToDisplay === undefined || scope.conditionToDisplay(msg)) {
                    return handleNotification(msg);
                  }
                });
            }, 0);
          };
        }
      };
    }])

  .directive('topRightNotification', ['livenotification', 'notificationService', '$timeout',
    function(livenotification, notificationService, $timeout) {
      return {
        restrict: 'E',
        controller: function() {
          this.addNotification = function(scope) {
            var stack_topright = {'dir1': 'down', 'dir2': 'left', 'push': 'top'};

            function handleNotification(msg) {
              notificationService.notify({
                title: scope.title(msg),
                text: scope.text(msg),
                addclass: 'stack_topright',
                stack: stack_topright,
                hide: false,
                styling: 'fontawesome'
              });
              if (scope.callbackOnNotification) {
                scope.callbackOnNotification(msg);
              }
            }

            $timeout(function() {
              livenotification
                .of(scope.namespace)
                .onNotification(function(msg) {
                  scope.conditionToDisplay = scope.conditionToDisplay || undefined;
                  if (scope.conditionToDisplay === undefined || scope.conditionToDisplay(msg)) {
                    return handleNotification(msg);
                  }
                });
            }, 0);
          };
        }
      };
    }])

  .directive('confirmNotification', ['livenotification', 'notificationService', '$timeout',
    function(livenotification, notificationService, $timeout) {
      return {
        restrict: 'E',
        controller: function() {

          this.unsubscribeNotification = function(scope, room) {
            $timeout(function() {
              livenotification.of(scope.namespace).unsubscribe(room);
            });
          };

          this.addNotification = function(scope) {
            var stack_topright = {'dir1': 'down', 'dir2': 'left', 'push': 'top'};

            function handleNotification(msg) {
              (notificationService.notify({
                title: scope.title(msg),
                text: scope.text(msg),
                icon: scope.icon,
                addclass: 'stack-topright',
                stack: stack_topright,
                hide: false,
                confirm: {
                  confirm: true
                },
                styling: 'fontawesome'
              })).get().on('pnotify.confirm', function() {
                  return scope.onConfirm(msg);
                }).on('pnotify.cancel', function() {
                  return scope.onCancel();
                });
              if (scope.callbackOnNotification) {
                scope.callbackOnNotification(msg);
              }
            }

            $timeout(function() {
              livenotification
                .of(scope.namespace)
                .on(scope.event, function(msg) {
                  scope.conditionToDisplay = scope.conditionToDisplay || undefined;
                  if (scope.conditionToDisplay === undefined || scope.conditionToDisplay(msg)) {
                    return handleNotification(msg);
                  }
                });
            }, 0);
          };
        }
      };
    }])

  .directive('activitystreamNotification', ['session', 'moment', function(session, moment) {
    return {
      require: '^infoNotification',
      scope: {
        room: '@',
        updates: '='
      },
      restrict: 'E',
      controller: function($scope) {
        $scope.namespace = '/activitystreams';
        $scope.title = function(msg) {
          return 'Activity Stream updated';
        };
        $scope.text = function(msg) {
          var m = moment(new Date(msg.published).getTime());
          return msg.actor.displayName + ' added a message ' + m.fromNow();
        };
        $scope.conditionToDisplay = function(msg) {
          return msg.actor && msg.actor._id !== session.user._id;
        };
        $scope.callbackOnNotification = function(msg) {
          $scope.updates = $scope.updates || [];
          $scope.updates.push(msg);
        };
      },
      link: function(scope, element, attrs, infoNotification) {
        infoNotification.addNotification(scope);
      }
    };
  }])

  .directive('conferenceNotification', ['$timeout', '$rootScope', '$location', function($timeout, $rootScope, $location) {
    return {
      require: '^confirmNotification',
      scope: {},
      restrict: 'E',
      controller: function($scope) {

        $scope.namespace = '/conferences';
        $scope.title = function(msg) {
          return 'Conference invitation !';
        };
        $scope.text = function(msg) {
          return 'Join the conference ?';
        };
        $scope.icon = 'fa fa-phone animated tada';
        $scope.event = 'invitation';
        $scope.onConfirm = function(msg) {
          if (!msg.conference_id) {
            return;
          }
          $timeout(function() {
            $location.path('/conferences/' + msg.conference_id);
          }, 0);
        };
        $scope.onCancel = function() {
          return;
        };
      },
      link: function(scope, element, attrs, confirmNotification) {
        confirmNotification.addNotification(scope);
        $rootScope.$on('conference:left', function(event, args) {
          confirmNotification.unsubscribeNotification(scope, args.conference_id);
        });
      }
    };
  }])

  .directive('liveConferenceNotification', ['session', function(session) {
    return {
      require: '^infoNotification',
      scope: {
        room: '@'
      },
      restrict: 'E',
      controller: function($scope) {
        $scope.namespace = '/conferences';
        $scope.title = function(msg) {
          return 'Conference updated !';
        };
        $scope.text = function(msg) {
          return msg.message;
        };
        $scope.conditionToDisplay = function(msg) {
          return msg.user_id !== session.user._id;
        };
      },
      link: function(scope, element, attrs, infoNotification) {
        infoNotification.addNotification(scope);
      }
    };
  }])

  .directive('notificationApiNotification', ['session', function(session) {

    return {
      require: '^topRightNotification',
      scope: {
      },
      restrict: 'E',
      controller: function($scope) {
        $scope.namespace = '/notifications';
        $scope.title = function(msg) {
          return msg.title || 'New notification';
        };
        $scope.text = function(msg) {
          if (msg.link) {
            return 'Check it out on <a target="_blank" href=\"' + msg.link + '\">link</a>';
          } else {
            return msg.author + ' ' + msg.action + ' a ' + msg.object;
          }
        };
        $scope.conditionToDisplay = function(msg) {
          return msg.target.some(function(item) {
            return item === session.user._id;
          });
        };
      },
      link: function(scope, element, attrs, infoNotification) {
        infoNotification.addNotification(scope);
      }
    };
  }]);
