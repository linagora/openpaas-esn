const { Issuer } = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');
const jose = require('jose');
const esnConfig = require('../esn-config');
const logger = require('../logger');
const CONFIG_KEY = 'openid-connect';
const OIDC_ISSUERS = new Map();

module.exports = {
  decodeToken,
  getUserInfo,
  getClientConfiguration,
  validateAccessToken
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

function getClientConfiguration(client_id) {
  if (!client_id) {
    return Promise.reject(new Error('OIDC : client_id is required to get configuration'));
  }

  return esnConfig(CONFIG_KEY).get()
    .then(configuration => {
      if (!configuration || !configuration.clients || !configuration.clients.length) {
        throw new Error(`OIDC : OpenID Connect is not configured correctly for client ${client_id}`);
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

function validateAccessToken(accessToken) {
  let clientId;
  let oidcConfiguration;

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
    .then(configuration => (oidcConfiguration = configuration))
    .then(() => getIssuer(oidcConfiguration.issuer_url))
    .then(issuer => issuer.keystore())
    .then(keystore => jose.JWT.verify(accessToken, keystore, { ignoreExp: true }))
    .then(verifiedPayload => validateTokenPayload(verifiedPayload, { iss: oidcConfiguration.issuer_url, client_id: oidcConfiguration.client_id }));
}

function validateTokenPayload(payload, assertions) {
  const clientId = typeof payload.aud === 'string' ? payload.aud : payload.azp;

  if (!clientId) {
    throw new Error('OIDC : client_id not found');
  }

  if (clientId !== assertions.client_id) {
    throw new Error('OIDC : Cannot validate access token due to client_id mismatch');
  }

  if (payload.iss !== assertions.iss) {
    throw new Error('OIDC : Cannot validate access token due to Issuer mismatch');
  }

  return payload;
}

function decodeToken(token) {
  return jsonwebtoken.decode(token);
}
