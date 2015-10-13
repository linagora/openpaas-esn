'use strict';

angular.module('linagora.esn.account')

  .controller('accountListController', function($scope, accounts, SUPPORTED_ACCOUNTS) {
    $scope.accounts = accounts.map(function(account) {
      if (SUPPORTED_ACCOUNTS.indexOf(account.type.toLowerCase()) > -1) {
        account.provider = account.data.provider;
      }
      return account;
    }).filter(function(account) {
      return !!account.provider;
    });
  });
