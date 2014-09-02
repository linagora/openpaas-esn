'use strict';

var mongoose = require('mongoose'),
    OAuthClient = mongoose.model('OAuthClient');

function list(req, res) {
  OAuthClient.find().sort('-created').exec(function(error, oauthclients) {
    if (error) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: error.details}});
    }
    return res.json(200, oauthclients);
  });
}

function create(req, res) {
  if (!req.user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }
  var oauthClientData = req.body;
  oauthClientData.creator = req.user;

  var oauthclient = new OAuthClient(oauthClientData);
  oauthclient.save(function(error, client) {
    if (error) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: error.details}});
    }
    return res.json(201, client);
  });
}

function get(req, res) {
  OAuthClient.findById(req.params.id, function(error, oauthclient) {
    if (error) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: error.details}});
    }
    if (!oauthclient) {
      return res.json(404);
    }
    return res.json(200, oauthclient);
  });
}

function remove(req, res) {
  OAuthClient.findByIdAndRemove(req.params.id, function(error, oauthclient) {
    if (error) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: error.details}});
    }
    if (!oauthclient) {
      return res.json(404);
    }
    return res.json(200, oauthclient);
  });
}

module.exports = {
  list: list,
  create: create,
  get: get,
  remove: remove
};
