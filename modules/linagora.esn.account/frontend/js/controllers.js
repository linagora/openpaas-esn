'use strict';

angular.module('linagora.esn.account')

  .controller('accountListController', function($scope, accounts) {
    $scope.accounts = accounts;
  });
