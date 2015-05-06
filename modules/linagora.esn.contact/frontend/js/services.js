'use strict';

angular.module('linagora.esn.contact')
  .run(['objectTypeResolver', 'objectTypeAdapter', 'contactAPI', 'contactAdapterService', 'Restangular', function(objectTypeResolver, objectTypeAdapter, contactAPI, contactAdapterService, Restangular) {
    objectTypeResolver.register('contact', contactAPI.get);
    objectTypeAdapter.register('contact', contactAdapterService);
    Restangular.extendModel('contacts', function(model) {
      return contactAdapterService(model);
    });
  }])
  .factory('ContactsRestangular', function(Restangular) {
    return Restangular.withConfig(function(config) {
      config.setBaseUrl('/contacts/api');
      config.setFullResponse(true);
    });
  })
  .factory('contactAdapterService', function() {
    return function(contact) {
      contact.objectType = 'contact';
      contact.htmlUrl = '/#/contacts/' + contact._id;
      contact.url = '/#/contacts/' + contact._id;
      return contact;
    };
  })
  .factory('contactAPI', ['Restangular', '$upload', function(Restangular, $upload) {
    function get(id) {
      return Restangular.one('contacts', id).get();
    }
    return {
      get: get
    };
  }]);
