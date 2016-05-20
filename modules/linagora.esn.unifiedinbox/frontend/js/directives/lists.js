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

  .directive('inboxMessageListItem', function($state, $q, newComposerService, _, inboxEmailService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope, $element) {
        var self = this;

        // need this scope value for action list
        $scope.email = $scope.item;

        self.openEmail = function(email) {
          if (email.isDraft) {
            newComposerService.openDraft(email.id);
          } else {
            $state.go('unifiedinbox.list.messages.message', {
              mailbox: ($scope.mailbox && $scope.mailbox.id) || _.first(email.mailboxIds),
              emailId: email.id
            });
          }
        };

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged'].forEach(function(action) {
          self[action] = function() {
            inboxEmailService[action]($scope.item);
          };
        });

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

        $scope.onSwipeLeft = inboxSwipeHelper.createSwipeLeftHandler($scope, function() {
          $element.controller('actionList').open();
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/list-item.html'
    };
  })

  .directive('inboxThreadListItem', function($state, $q, newComposerService, _, inboxThreadService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope, $element) {
        var self = this;

        // need this scope value for action list
        $scope.thread = $scope.item;

        self.openThread = function(thread) {
          if (thread.email.isDraft) {
            newComposerService.openDraft(thread.email.id);
          } else {
            $state.go('unifiedinbox.list.threads.thread', {
              mailbox: ($scope.mailbox && $scope.mailbox.id) || _.first(thread.email.mailboxIds),
              threadId: thread.id
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

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: self.markAsRead,
          moveToTrash: self.moveToTrash
        });

        $scope.onSwipeLeft = inboxSwipeHelper.createSwipeLeftHandler($scope, function() {
          $element.controller('actionList').open();
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
