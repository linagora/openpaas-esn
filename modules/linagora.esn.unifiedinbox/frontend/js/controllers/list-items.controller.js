'use strict';

(function() {

  angular.module('linagora.esn.unifiedinbox').controller('listItemsController',
    function($scope, $stateParams, mailboxesService, inboxFilteringAwareInfiniteScroll, mailboxIdsFilter, hostedMailProvider,
             inboxFilteringService, inboxSelectionService, inboxAsyncHostedMailControllerHelper) {

      inboxAsyncHostedMailControllerHelper(this, function() {
        return mailboxesService.assignMailbox($stateParams.mailbox, $scope);
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
