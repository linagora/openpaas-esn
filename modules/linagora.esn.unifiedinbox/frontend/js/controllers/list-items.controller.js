'use strict';

(function() {

  angular.module('linagora.esn.unifiedinbox').controller('listItemsController',
    function($scope, $stateParams, inboxMailboxesService, inboxFilteringAwareInfiniteScroll, mailboxIdsFilter, hostedMailProvider,
             inboxFilteringService, inboxSelectionService, inboxAsyncHostedMailControllerHelper) {

      inboxAsyncHostedMailControllerHelper(this, function() {
        return inboxMailboxesService.assignMailbox($stateParams.mailbox, $scope);
      }).then(function() {
        inboxSelectionService.unselectAllItems();

        inboxFilteringAwareInfiniteScroll($scope, function() {
          return inboxFilteringService.getFiltersForJmapMailbox($stateParams.mailbox);
        }, function() {
          return hostedMailProvider.fetch(angular.extend({}, mailboxIdsFilter, inboxFilteringService.getJmapFilter()));
        });
      });
    }
  );

})();
