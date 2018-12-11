(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('ContactVirtualAddressBookService', ContactVirtualAddressBookService);

  function ContactVirtualAddressBookService($q, _, ContactVirtualAddressBookRegistry, ContactVirtualAddressBookConfiguration) {
    return {
      get: get,
      list: list
    };

    /**
     * Return enabled virtual addressbooks
     */
    function list() {
      return ContactVirtualAddressBookRegistry.list().then(function(addressbooks) {
        return $q.all(addressbooks.map(function(addressbook) {
          return ContactVirtualAddressBookConfiguration.isEnabled(addressbook.id).then(function(enabled) {
            addressbook.enabled = enabled;

            return addressbook;
          }).catch(function() {
            addressbook.enabled = false;

            return addressbook;
          });
        }))
        .then(function(addressbooks) {
          return _.filter(addressbooks, 'enabled');
        })
        .then(function(addressbooks) {
          return $q.all(addressbooks.map(function(addressbook) {
            return addressbook.loadContactsCount();
          })).then(function() {
            return addressbooks;
          });
        });
      });
    }

    /**
     * Return addressbook if found enabled
     *
     * @param {String} id
     */
    function get(id) {
      return ContactVirtualAddressBookRegistry.get(id).then(function(addressbook) {
        if (!addressbook) {
          return;
        }

        return ContactVirtualAddressBookConfiguration.isEnabled(id).then(function(enabled) {
          if (!enabled) {
            return $q.reject(new Error(id + ' has been disabled'));
          }

          return addressbook;
        }).then(function(addressbook) {
          return addressbook.loadContactsCount().then(function() {
            return addressbook;
          });
        });
      });
    }
  }
})(angular);
