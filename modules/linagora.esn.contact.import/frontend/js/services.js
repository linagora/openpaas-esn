'use strict';

angular.module('linagora.esn.contact.import')

  .factory('contactImportAPI', function(Restangular, CONTACT_IMPORT_URL) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl(CONTACT_IMPORT_URL);
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('ContactImporterService', function(contactImportAPI) {

    function importContacts(type, account) {
      return contactImportAPI.all(type).post({account_id: account.data.id});
    }

    return {
      import: importContacts
    };
  })

  .factory('ContactImportRegistry', function() {

    var cache = {};

    function register(type, provider) {
      cache[type] = provider;
    }

    function get(type) {
      return cache[type];
    }

    return {
      register: register,
      get: get
    };
  })

  .factory('ContactImporter', function($log, $q, ContactImportRegistry, notificationFactory) {

    function importContacts(type, account) {

      var importer = ContactImportRegistry.get(type);
      if (!importer) {
        $log.error('Can not find importer ' + type);
        return;
      }

      return importer.import(account)
        .then(function(response) {
          if (response.status === 202) {
            notificationFactory.notify(
              'info',
              '',
              'Importing ' + account.provider + ' contacts for @' + account.data.username,
              {from: 'bottom', align: 'center'},
              3000);
          } else {
            $log.debug('Unknown status code (%s) while importing contacts', response.status);
          }
        }, function(err) {
          notificationFactory.notify(
            'danger',
            '',
            'Error while importing' + account.provider + ' contacts for @ ' + account.data.username + ':' + err,
            {from: 'bottom', align: 'center'},
            3000);
        });
    }

    return {
      import: importContacts
    };
  });
