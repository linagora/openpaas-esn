(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('VirtualAddressBookRegistry', VirtualAddressBookRegistry);

  function VirtualAddressBookRegistry(_, $q) {
    var addressbooks = {};

    return {
      put: put,
      get: get,
      list: list
    };

    function put(addressbook) {
      addressbooks[addressbook.id] = addressbook;
    }

    function get(id) {
      return addressbooks[id];
    }

    function list() {
      return $q.when(_.values(addressbooks));
    }
  }
})(angular);
