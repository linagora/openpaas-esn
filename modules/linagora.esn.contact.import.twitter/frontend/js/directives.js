'use strict';

angular.module('linagora.esn.contact.import.twitter')

.directive('twitterContactImportMenuItem', function(TwitterContactImporter, notificationFactory) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/contact.import.twitter/views/partials/account-import-menu-item.html',
    link: function(scope) {

      scope.importContacts = function() {
        TwitterContactImporter.import()
          .then(function(response) {
            if (response.status === 202) {
              notificationFactory.notify(
                'info',
                '',
                'Importing ' + scope.account.provider + ' contacts for @' + scope.account.data.username,
                {from: 'bottom', align: 'center'},
                3000);
            }
          }, function(err) {
            notificationFactory.notify(
              'danger',
              '',
              'Error while importing' + scope.account.provider + ' contacts for @ ' + scope.account.data.username + ':' + err,
              {from: 'bottom', align: 'center'},
              3000);
          });
      };
    }
  };
});
