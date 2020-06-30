const { Issuer } = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');
const esnConfig = require('../esn-config');
const logger = require('../logger');

module.exports = {
  getUserInfo,
  getClientConfiguration
};

function getUserInfo(accessToken) {
  // TODO: We may not need to get the user info from the OIDC server
  // Returning an object from accessToken claims should be enough if token is valid
  let clientId;

  try {
    clientId = getClientId(accessToken);
  } catch (err) {
    logger.error('OIDC : Error while getting clientID from access token', err);

    return Promise.reject(new Error('OIDC : Cannot decode access token'));
  }

  if (!clientId) {
    return Promise.reject(new Error('OIDC : ClientID was not found in access token'));
  }

  return getClientConfiguration(clientId)
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

function getClientConfiguration(client_id) {
  if (!client_id) {
    return Promise.reject(new Error('OIDC : client_id is required to get configuration'));
  }

  return esnConfig('openid-connect').get()
    .then(configuration => {
      if (!configuration || !configuration.clients || !configuration.clients.length) {
        throw new Error('OIDC : OpenID Connect is not configured');
      }

      const clientConfiguration = configuration.clients.find(element => element.client_id === client_id);

      if (!clientConfiguration) {
        throw new Error(`OIDC : OpenID Connect is not configured for client ${client_id}`);
      }

      return { ...{ issuer_url: configuration.issuer_url }, ...clientConfiguration };
    });
}

function getClientId(accessToken) {
  const token = jsonwebtoken.decode(accessToken);

  // if 'aud' is a string, it is the clientId
  if (typeof token.aud === 'string') {
    return token.aud;
  }

  // if 'aud' is an array it must contain the clientId and must define it in 'azp'
  return token.azp;
}
