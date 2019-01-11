'use strict';

angular.module('linagora.esn.account')

  .controller('accountListController', function(
    $scope,
    $location,
    dynamicDirectiveService,
    displayAccountMessage,
    accounts,
    providers,
    SUPPORTED_ACCOUNTS,
    ACCOUNT_EVENTS
    ) {
    if (!accounts || !providers) {
      $scope.error = true;
    }

    if (providers && providers.length > 0 && dynamicDirectiveService.getInjections('accounts-item-anchorpoint', {}).length > 0) {
      $scope.hasAccountProvider = true;
    }

    $scope.accounts = accounts && accounts.map(function(account) {
      if (SUPPORTED_ACCOUNTS.indexOf(account.type.toLowerCase()) > -1) {
        account.provider = account.data.provider;
        account.id = account.data.id;
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

    $scope.$on(ACCOUNT_EVENTS.DELETED, function(evt, id) {
      $scope.accounts.forEach(function(account, index) {
        if (account.id === id) {
          $scope.accounts.splice(index, 1);
        }
      });
    });
  })

  .controller('socialAccountController', function($scope, ACCOUNT_MESSAGES, ACCOUNT_EVENTS, notificationFactory) {
    $scope.deleteAccount = function(account) {
      account.remove().then(function(response) {
        if (response.status !== 204) {
          notificationFactory.weakError(ACCOUNT_MESSAGES.delete_error, response.data.error);
        } else {
          notificationFactory.weakSuccess('', ACCOUNT_MESSAGES.deleted);
          $scope.$emit(ACCOUNT_EVENTS.DELETED, account.id);
        }
      }, function(response) {
        notificationFactory.weakError(ACCOUNT_MESSAGES.delete_error, response.data.error);
      });
    };
  });
