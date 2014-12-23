'use strict';

var auth = require('../../core/auth/token');
var user = require('../../core/user');

var getNewToken = function(req, res) {
  auth.getNewToken({ttl: 60, user: req.user._id}, function(err, token) {
    if (err || !token) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
    }
    return res.json(200, token);
  });
};
module.exports.getNewToken = getNewToken;

var getToken = function(req, res) {
  if (!req.params.token) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Can not retrieve token'}});
  }

  auth.getToken(req.params.token, function(err, token) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not get token'}});
    }

    if (!token) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'Token not found or expired'}});
    }

    return res.json(200, token);
  });
};
module.exports.getToken = getToken;

var isValid = function(req, res) {
  if (!req.params.token) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Can not retrieve token'}});
  }

  auth.validateToken(req.params.token, function(valid) {
    return res.json(200, {valid: valid});
  });
};
module.exports.isValid = isValid;

var authenticateByToken = function(req, res) {
  if (!req.params.token) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Can not retrieve token'}});
  }

  auth.getToken(req.params.token, function(err, token) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while getting user from token'}});
    }
    if (!token) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Invalid token'}});
    }
    if (!token.user) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'Can not find user from token'}});
    }

    user.get(token.user, function(err, u) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while loading user'}});
      }
      if (!u) {
        return res.json(404, {error: {code: 404, message: 'Not found', details: 'User not found'}});
      }

      var finishRequest = function(err) {
        if (err) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while logging in user'}});
        }
        delete u.password;
        return res.json(200, u);
      };

      if (req.user) {
        finishRequest(null);
      } else {
        req.login(u, finishRequest);
      }
    });
  });
};
module.exports.authenticateByToken = authenticateByToken;
