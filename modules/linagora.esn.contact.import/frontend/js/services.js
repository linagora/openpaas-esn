'use strict';

angular.module('linagora.esn.contact.import')

  .factory('contactImportAPI', function(Restangular, CONTACT_IMPORT_URL) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl(CONTACT_IMPORT_URL);
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('ContactImporterService', function(contactImportAPI) {

    function importContact(type) {
      return contactImportAPI.all(type).post();
    }

    return {
      importContact: importContact
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
  });
