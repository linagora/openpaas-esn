'use strict';

var jwt = require('../../core/auth/jwt');

function generatePayloadWithSubject(user) {
  return (user && user.preferredEmail) ? {subject: user.preferredEmail} : {};
}

function generateWebToken(req, res) {

  jwt.generateWebToken(generatePayloadWithSubject(req.user), function(err, token) {
    if (err || !token) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate the JWT'}});
    }
    return res.status(200).json(token);
  });
}

module.exports.generateWebToken = generateWebToken;
