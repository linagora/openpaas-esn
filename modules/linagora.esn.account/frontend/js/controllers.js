'use strict';

angular.module('linagora.esn.account')

  .controller('accountListController', function($scope, $location, displayAccountMessage, accounts, SUPPORTED_ACCOUNTS) {
    $scope.accounts = accounts.map(function(account) {
      if (SUPPORTED_ACCOUNTS.indexOf(account.type.toLowerCase()) > -1) {
        account.provider = account.data.provider;
      }
      return account;
    }).filter(function(account) {
      return !!account.provider;
    });

    if ($location.search().status) {
      $scope.status = $location.search().status;
      $scope.provider = $location.search().provider;
      displayAccountMessage($scope.provider, $scope.status);
    }
  })

  .controller('accountController', function($scope, notificationFactory, ContactImportRegistry) {
    $scope.importContact = function() {
      ContactImportRegistry.get($scope.account.provider).import()
        .then(function(response) {
          if (response.status === 202) {
            notificationFactory.notify(
              'info',
              '',
              'Importing ' + $scope.account.provider + 'contact',
              { from: 'bottom', align: 'center'},
              3000);
          }
        }, function(err) {
          notificationFactory.notify(
            'danger',
            '',
            'Error while importing' + $scope.account.provider + 'account' + err,
            { from: 'bottom', align: 'center'},
            3000);
        });
    };
  });
