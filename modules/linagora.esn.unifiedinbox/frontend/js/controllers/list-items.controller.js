'use strict';

(function() {

  angular.module('linagora.esn.unifiedinbox').controller('listItemsController',
    function($scope, $stateParams, mailboxesService, infiniteScrollOnGroupsHelper, ByDateElementGroupingTool, filter, hostedMailProvider) {
      $scope.listFilter = $stateParams.filter;
      $scope.loadMoreElements = infiniteScrollOnGroupsHelper($scope, hostedMailProvider.fetch(filter), new ByDateElementGroupingTool());

      mailboxesService.assignMailbox($stateParams.mailbox, $scope);
    });

})();
