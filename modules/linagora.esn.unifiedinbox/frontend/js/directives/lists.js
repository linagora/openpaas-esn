'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxDraggableListItem', function() {
    return {
      restrict: 'A',
      link: function(scope) {
        scope.onDragEnd = function($dropped) {
          if ($dropped) {
            scope.groups.removeElement(scope.item);
          }
        };

        scope.onDropFailure = function() {
          return scope.groups.addElement(scope.item);
        };
      }
    };
  })

  .directive('inboxSwipeableListItem', function(inboxConfig) {
    return {
      restrict: 'A',
      controller: function($scope, $element) {
        $scope.onSwipeLeft = function() {
          var unregisterActionListCloseListener = $scope.$on('action-list.hide', function() {
            $scope.swipeClose();
            unregisterActionListCloseListener();
          });

          $element.controller('actionList').open();
        };
      },
      link: function(scope) {
        inboxConfig('swipeRightAction', 'markAsRead').then(function(action) {
          scope.leftTemplate = '/unifiedinbox/views/partials/swipe/left-template-' + action + '.html';
        });
      }
    };
  })

  .directive('inboxMessageListItem', function($state, $q, $stateParams, newComposerService, _, inboxEmailService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope) {
        var self = this;

        // need this scope value for action list
        $scope.email = $scope.item;

        self.openEmail = function(email) {
          if (email.isDraft) {
            newComposerService.openDraft(email.id);
          } else {
            // Used to fallback to the absolute state name if the transition to a relative state does not work
            // This allows us to plug '.message' states where we want and guarantee the email can still be opened
            // when coming from a state that does not get a .message child state (like search for instance)
            var unregisterStateNotFoundListener = $scope.$on('$stateNotFound', function(event, redirect) {
              redirect.to = 'unifiedinbox.list.messages.message';
            });

            $state.go('.message', {
              mailbox: $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || _.first(email.mailboxIds),
              emailId: email.id,
              item: email
            }).finally(unregisterStateNotFoundListener);
          }
        };

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          self[action] = function() {
            inboxEmailService[action]($scope.item);
          };
        });

        self.move = function() {
          $state.go('.move', { item: $scope.item });
        };

        self.moveToTrash = function() {
          $scope.groups.removeElement($scope.item);

          return inboxEmailService.moveToTrash($scope.item, { silent: true })
            .catch(function(err) {
              $scope.groups.addElement($scope.item);

              return $q.reject(err);
            });
        };

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: self.markAsRead,
          moveToTrash: self.moveToTrash
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/list-item.html'
    };
  })

  .directive('inboxThreadListItem', function($state, $q, $stateParams, newComposerService, _, inboxThreadService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope) {
        var self = this;

        // need this scope value for action list
        $scope.thread = $scope.item;

        self.openThread = function(thread) {
          if (thread.email.isDraft) {
            newComposerService.openDraft(thread.email.id);
          } else {
            $state.go('.thread', {
              mailbox: $stateParams.mailbox || ($scope.mailbox && $scope.mailbox.id) || _.first(thread.email.mailboxIds),
              threadId: thread.id,
              item: thread
            });
          }
        };

        self.moveToTrash = function() {
          $scope.groups.removeElement($scope.item);

          return inboxThreadService.moveToTrash($scope.item, { silent: true })
            .catch(function(err) {
              $scope.groups.addElement($scope.item);

              return $q.reject(err);
            });
        };

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          self[action] = function() {
            inboxThreadService[action]($scope.item);
          };
        });

        self.move = function() {
          $state.go('.move', { item: $scope.item, threadId:  $scope.item.id });
        };

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: self.markAsRead,
          moveToTrash: self.moveToTrash
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/thread/list/list-item.html'
    };
  })

  .directive('inboxTweetListItem', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/twitter/list/list-item.html'
    };
  });
