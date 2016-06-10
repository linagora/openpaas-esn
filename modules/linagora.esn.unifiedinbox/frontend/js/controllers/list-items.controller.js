'use strict';

(function() {

  angular.module('linagora.esn.unifiedinbox').controller('listItemsController',
    function($scope, $stateParams, mailboxesService, inboxFilteringAwareInfiniteScroll, mailboxIdsFilter, hostedMailProvider, inboxFilteringService) {
      mailboxesService.assignMailbox($stateParams.mailbox, $scope);

      inboxFilteringAwareInfiniteScroll($scope, function() {
        return inboxFilteringService.getFiltersForJmapMailbox($stateParams.mailbox);
      }, function() {
        return hostedMailProvider.fetch(angular.extend({}, mailboxIdsFilter, inboxFilteringService.getJmapFilter()));
      });
    }
  );

})();
