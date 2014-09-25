'use strict';

var userModule = require('../../core/user');
var communityController = require('./communities');
var userController = require('./users');

function getUserAvatarFromEmail(req, res) {
  userModule.findByEmail(req.query.email, function(err, user) {
    if (err || !user) {
      return res.redirect('/images/not_a_user.png');
    }
    req.user = user;
    return userController.getProfileAvatar(req, res);
  });
}

function getCommunityAvatar(req, res) {
  if (!req.query.id) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community id is mandatory'}});
  }

  req.params.id = req.query.id;

  communityController.load(req, res, function(err) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server Error', details: 'Error while getting avatar'}});
    }
    return communityController.getAvatar(req, res);
  });
}

module.exports.get = function(req, res) {
  if (!req.query.objectType) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'objectType parameter is mandatory'}});
  }

  if (req.query.objectType === 'user') {
    return getUserAvatarFromEmail(req, res);
  }

  if (req.query.objectType === 'community') {
    return getCommunityAvatar(req, res);
  }

  return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Unknown objectType parameter'}});
};
