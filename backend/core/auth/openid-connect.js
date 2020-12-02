const { Issuer } = require('openid-client');
const esnConfig = require('../esn-config');
const logger = require('../logger');
const CONFIG_KEY = 'openid-connect';
const OIDC_ISSUERS = new Map();

module.exports = {
  getUserInfosFromProvider
};

/**
 * Tries the access token against all the registered OIDC providers to fetch
 * the user email
 *
 * Returns either a nullish value, or an object:
 * {
 *    provider: an object with keys: client_id, client_secret, issuer_url, ...
 *    infos: an object with user information. Depends on the OIDC provider type and configuration. We expect a email key.
 * }
 *
 * @param {string} accessToken The access toekn sent by the user-agent
 */
function getUserInfosFromProvider(accessToken) {
  return esnConfig(CONFIG_KEY).get()
    .then(configuration => {
      if (!configuration || !configuration.clients || !configuration.clients.length) {
        return null;
      }

      return testAllProviders(accessToken, configuration.clients);
    });
}

function testAllProviders(accessToken, providers) {
  const _providers = [...providers];

  return new Promise(resolve => {
    testOneAccessToken();

    function testOneAccessToken() {
      if (!_providers.length) {
        return resolve();
      }

      const provider = _providers.shift();

      getIssuerClient(provider)
        .then(client => client.userinfo(accessToken))
        .then(infos => {
          if (!infos.email) {
            logger.warn(`Core Auth - OIDC: OIDC provider ${provider.issuer_url}: authentication succeeded, but there is no email in the user information.`);
            throw new Error('No email key in user information');
          }

          return infos;
        })
        .then(infos => resolve({infos, provider}))
        .catch(e => {
          logger.warn(`Core Auth - OIDC: Provider failed - ${provider.issuer_url}`, e && e.message || e);
          testOneAccessToken();
        });
    }
  });
}

function getIssuer(issuer_url) {
  if (OIDC_ISSUERS.has(issuer_url)) {
    return Promise.resolve(OIDC_ISSUERS.get(issuer_url));
  }

  return Issuer.discover(issuer_url)
    .then(issuer => {
      OIDC_ISSUERS.set(issuer_url, issuer);

      return issuer;
    });
}

function getIssuerClient({ issuer_url, client_id, client_secret }) {
  return getIssuer(issuer_url)
    .then(issuer => new issuer.Client({
      client_id,
      client_secret
    }));
}
