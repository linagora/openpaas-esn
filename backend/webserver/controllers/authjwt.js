'use strict';

const jwt = require('../../core/auth/jwt');
const logger = require('../../core/logger');
const DEFAULT_JWT_DURATION = '12h';

function generatePayloadWithSubject(user) {
  return (user && user.preferredEmail) ? {sub: user.preferredEmail} : {};
}

function generateWebToken(req, res) {
  const { expiresIn = DEFAULT_JWT_DURATION } = req.query || {};

  jwt.generateWebToken(generatePayloadWithSubject(req.user), { expiresIn }, function(err, token) {
    if (err || !token) {
      logger.error('Can not generate the JWT', err);

      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate the JWT'}});
    }
    return res.status(200).json(token);
  });
}

module.exports.generateWebToken = generateWebToken;
