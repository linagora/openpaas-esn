'use strict';

angular.module('linagora.esn.contact.import.twitter')

.directive('twitterContactImportMenuItem', function($log, ContactImporter, TWITTER_CONTACT_IMPORT_TYPE) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/contact.import.twitter/views/partials/account-import-menu-item.html',
    link: function(scope) {

      scope.importContacts = function() {
        ContactImporter.import(TWITTER_CONTACT_IMPORT_TYPE, scope.account).then(function() {
          $log.debug('Contact import launched');
        }, function(err) {
          $log.error('Contact import failure', err);
        });
      };
    }
  };
});
