'use strict';

angular.module('linagora.esn.contact.import.google')

.directive('googleContactImportMenuItem', function($log, ContactImporter, GOOGLE_CONTACT_IMPORT_TYPE) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/contact.import.google/views/partials/account-import-menu-item.html',
    link: function(scope) {

      scope.importContacts = function() {
        ContactImporter.import(GOOGLE_CONTACT_IMPORT_TYPE, scope.account).then(function() {
          $log.debug('Google contact import launched');
        }, function(err) {
          $log.error('Google contact import failure', err);
        });
      };
    }
  };
});
