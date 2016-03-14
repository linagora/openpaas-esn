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
  });
