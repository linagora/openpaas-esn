(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxIdentitiesService', function($q, $http, uuid4, inboxConfig, esnUserConfigurationService, _,
                                                INBOX_MODULE_NAME) {
      var identities;

      return {
        getAllIdentities: getAllIdentities,
        getDefaultIdentity: getDefaultIdentity,
        getIdentity: getIdentity,
        storeIdentity: storeIdentity,
        removeIdentity: removeIdentity
      };

      /////

      function getAllIdentities() {
        if (identities) {
          return $q.when(identities);
        }

        return $q.all([
          $http.get('/unifiedinbox/api/inbox/identities/default').then(_.property('data')),
          inboxConfig('identities', [])
        ]).then(function(results) {
          identities = _(results[0]).concat(results[1]).value();

          return identities;
        });
      }

      function getDefaultIdentity() {
        return getAllIdentities().then(function(identities) {
          return _.find(identities, { isDefault: true });
        });
      }

      function getIdentity(id) {
        return getAllIdentities().then(function(identities) {
          return _.find(identities, { id: id });
        });
      }

      function storeIdentity(identity) {
        return getAllIdentities().then(function() {
          if (!identity.id) {
            identity.id = uuid4.generate();

            identities.push(identity);
          }

          return esnUserConfigurationService.set([_getConfigurationObjectForIdentity(identity)], INBOX_MODULE_NAME);
        });
      }

      function removeIdentity(identity) {
        if (identity.isDefault) {
          return $q.reject(new Error('Could not remove the default identity'));
        }

        return getAllIdentities().then(function() {
          _.pull(identities, identity);

          return esnUserConfigurationService.set([_getConfigurationObjectForIdentity(identity)], INBOX_MODULE_NAME);
        });
      }

      function _getConfigurationObjectForIdentity(identity) {
        if (identity.isDefault) {
          return {
            name: 'identities.default',
            value: {
              textSignature: identity.textSignature
            }
          };
        }

        return {
          name: 'identities',
          value: _.reject(identities, { isDefault: true })
        };
      }

    });

})();
