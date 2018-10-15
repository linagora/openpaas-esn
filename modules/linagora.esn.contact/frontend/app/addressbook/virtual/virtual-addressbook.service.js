(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('VirtualAddressBookService', VirtualAddressBookService);

  function VirtualAddressBookService($q, _, VirtualAddressBookRegistry, VirtualAddressBookConfiguration) {
    return {
      get: get,
      list: list
    };

    /**
     * Return enabled virtual addressbooks
     */
    function list() {
      return VirtualAddressBookRegistry.list().then(function(addressbooks) {
        return $q.all(addressbooks.map(function(addressbook) {
          return VirtualAddressBookConfiguration.isEnabled(addressbook.id).then(function(enabled) {
            addressbook.enabled = enabled;

            return addressbook;
          }).catch(function() {
            addressbook.enabled = false;

            return addressbook;
          });
        })).then(function(addressbooks) {
          return _.filter(addressbooks, 'enabled');
        });
      });
    }

    /**
     * Return addressbook if found enabled
     *
     * @param {String} id
     */
    function get(id) {
      return VirtualAddressBookRegistry.get(id).then(function(addressbook) {
        if (!addressbook) {
          return $q.reject(new Error('No such virtual addressbook', id));
        }

        return VirtualAddressBookConfiguration.isEnabled(id).then(function(enabled) {
          if (!enabled) {
            return $q.reject(new Error(id + ' has been disabled'));
          }

          return addressbook;
        });
      });
    }
  }
})(angular);
