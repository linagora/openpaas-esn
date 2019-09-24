const { Issuer } = require('openid-client');
const esnConfig = require('../esn-config');

module.exports = {
  getUserInfo
};

function getUserInfo(accessToken) {
  return esnConfig('oidc').get()
    .then(configuration => {
      if (!configuration) {
        throw new Error('OpenID Connect is not configured');
      }

      return configuration;
    })
    .then(configuration => getIssuerClient(configuration))
    .then(client => client.userinfo(accessToken));
}

function getIssuerClient({ issuer_url, client_id, client_secret }) {
  // TODO: Avoid discover each time which makes a call to the auth provider
  // We must be able to do a cache based on issue and client id/secret
  return Issuer.discover(issuer_url)
    .then(issuer => new issuer.Client({
      client_id,
      client_secret
    }));
}
