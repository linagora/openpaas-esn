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
  var oauthclient = new OAuthClient(req.body);
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
