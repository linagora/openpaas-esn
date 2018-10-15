(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('VirtualAddressBookConfiguration', VirtualAddressBookConfiguration);

  function VirtualAddressBookConfiguration($q, esnConfig, VirtualAddressBookRegistry) {
    return {
      isEnabled: isEnabled
    };

    function isEnabled(id) {
      return VirtualAddressBookRegistry.get(id).then(function(addressbook) {
        if (!addressbook) {
          return $q.reject(new Error(id + ' is not a valid addressbook'));
        }

        return esnConfig(addressbook.options.configuration.enabled, true);
      });
    }
  }

})(angular);
