'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMessageListItem', function($state, newComposerService, _) {
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
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/list-emails/inbox-message-list-item.html'
    };
  })

  .directive('inboxThreadListItem', function($state, newComposerService, _) {
    return {
      restrict: 'E',
      controller: function($scope) {
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
      },
      controllerAs: 'ctrl',
      templateUrl: '/unifiedinbox/views/list-threads/inbox-thread-list-item.html'
    };
  })

  .directive('inboxTweetListItem', function() {
    return {
      restrict: 'E',
      templateUrl: '/unifiedinbox/views/list-tweets/inbox-tweet-list-item.html'
    };
  });
