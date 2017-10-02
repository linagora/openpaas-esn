'use strict';

var auth = require('../../core/auth/token');
var user = require('../../core/user');
var technicalUser = require('../../core/technical-user');
var utils = require('./utils');
var denormalizeUser = require('../denormalize/user').denormalize;

var getNewToken = function(req, res) {
  auth.getNewToken({ttl: 60, user: req.user._id}, function(err, token) {
    if (err || !token) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
    }
    return res.status(200).json(token);
  });
};
module.exports.getNewToken = getNewToken;

var getToken = function(req, res) {
  res.status(200).json(req.token);
};
module.exports.getToken = getToken;

var isValid = function(req, res) {
  if (!req.params.token) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Can not retrieve token'}});
  }

  auth.validateToken(req.params.token, function(valid) {
    return res.status(200).json({valid: valid});
  });
};
module.exports.isValid = isValid;

function authenticateUser(req, res) {
  var token = req.token;
  user.get(token.user, function(err, u) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Error while loading user'}});
    }

    if (!u) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'User not found'}});
    }

    var finishRequest = function(err) {
      if (err) {
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Error while logging in user'}});
      }

      denormalizeUser(u, { includePrivateData: true }).then(function(response) {
        response.user_type = user.TYPE;
        res.status(200).json(response);
      });
    };

    if (req.user) {
      finishRequest(null);
    } else {
      req.login(u, finishRequest);
    }
  });
}

function authenticateTechnicalUser(req, res) {
  var token = req.token;
  technicalUser.get(token.user, function(err, u) {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Error while loading technical user'}});
    }

    if (!u) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Technical User not found'}});
    }

    var response = utils.sanitizeTechnicalUser(u);
    response.user_type = technicalUser.TYPE;
    return res.status(200).json(response);
  });

}

function authenticateByToken(req, res) {
  if (req.token.user_type && req.token.user_type === technicalUser.TYPE) {
    return authenticateTechnicalUser(req, res);
  }

  authenticateUser(req, res);
}
module.exports.authenticateByToken = authenticateByToken;
