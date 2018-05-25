(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('AddressBookPaginationRegistry', AddressBookPaginationRegistry);

  function AddressBookPaginationRegistry() {
    var providers = {};

    return {
      put: put,
      get: get
    };

    function put(type, provider) {
      providers[type] = provider;
    }

    function get(type) {
      return providers[type];
    }
  }
})(angular);
