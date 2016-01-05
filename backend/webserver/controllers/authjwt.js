'use strict';

var jwt = require('../../core/auth/jwt');

var generateWebToken = function(req, res) {
  jwt.generateWebToken({}, function(err, token) {
    if (err || !token) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate the JWT'}});
    }
    return res.status(200).json(token);
  });
};

module.exports.generateWebToken = generateWebToken;
