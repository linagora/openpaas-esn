'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMessageListItem', function($state, $q, newComposerService, _, inboxEmailService, inboxSwipeHelper) {
    return {
      restrict: 'E',
      controller: function($scope, $element) {
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

        $scope.email = $scope.item;

        ['reply', 'replyAll', 'forward', 'markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          this[action] = function() {
            inboxEmailService[action]($scope.email);
          };
        }.bind(this));

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: function() {
            return inboxEmailService.markAsRead($scope.item);
          },
          moveToTrash: function() {
            $scope.groups.removeElement($scope.item);

            return inboxEmailService.moveToTrash($scope.item, { silent: true }).then(null, function(err) {
              $scope.groups.addElement($scope.item);
              return $q.reject(err);
            });
          }
        });

        $scope.onSwipeLeft = inboxSwipeHelper.createSwipeLeftHandler($scope, function() {
          $element.controller('actionList').open();
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/email/list/list-item.html',
      link: function(scope, element) {
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

  .directive('inboxThreadListItem', function($state, $q, newComposerService, _, inboxThreadService, inboxSwipeHelper) {
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

        $scope.thread = $scope.item;

        ['markAsUnread', 'markAsRead', 'markAsFlagged', 'unmarkAsFlagged', 'moveToTrash'].forEach(function(action) {
          this[action] = function() {
            inboxThreadService[action]($scope.item);
          };
        }.bind(this));

        $scope.onSwipeRight = inboxSwipeHelper.createSwipeRightHandler($scope, {
          markAsRead: function() {
            return inboxThreadService.markAsRead($scope.item.email);
          },
          moveToTrash: function() {
            $scope.groups.removeElement($scope.item);

            return inboxThreadService.moveToTrash($scope.item, { silent: true }).then(null, function(err) {
              $scope.groups.addElement($scope.item);
              return $q.reject(err);
            });
          }
        });

        $scope.onSwipeLeft = inboxSwipeHelper.createSwipeLeftHandler($scope, function() {
          $element.controller('actionList').open();
        });
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/thread/list/list-item.html',
      link: function(scope, element) {
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

  .directive('inboxTweetListItem', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/twitter/list/list-item.html'
    };
  });
