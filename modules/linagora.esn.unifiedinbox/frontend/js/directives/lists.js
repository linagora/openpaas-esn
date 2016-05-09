'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMessageListItem', function($state, newComposerService, _, inboxEmailService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope) {
        this.openEmail = function(email) {
          if (email.isDraft) {
            newComposerService.openDraft(email.id);
          } else {
            $state.go('unifiedinbox.list.messages.message', {
              mailbox: ($scope.mailbox && $scope.mailbox.id) || _.first(email.mailboxIds),
              emailId: email.id
            });
          }
        };

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: function() {
            return inboxEmailService.markAsRead($scope.item);
          }
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/list-item.html'
    };
  })

  .directive('inboxThreadListItem', function($state, newComposerService, _, inboxThreadService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope, $element) {
        this.openThread = function(thread) {
          if (thread.email.isDraft) {
            newComposerService.openDraft(thread.email.id);
          } else {
            $state.go('unifiedinbox.list.threads.thread', {
              mailbox: ($scope.mailbox && $scope.mailbox.id) || _.first(thread.email.mailboxIds),
              threadId: thread.id
            });
          }
        };

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          this[action] = function() {
            inboxThreadService[action]($scope.item);
          };
        }.bind(this));

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: function() {
            return inboxThreadService.markAsRead($scope.item.email);
          }
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
