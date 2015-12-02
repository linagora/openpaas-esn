'use strict';

angular.module('linagora.esn.contact.import')

  .factory('contactImportAPI', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/import/api');
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
