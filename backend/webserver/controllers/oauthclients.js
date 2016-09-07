'use strict';

var mongoose = require('mongoose'),
    OAuthClient = mongoose.model('OAuthClient');

function list(req, res) {
  OAuthClient.find().sort('-created').exec(function(error, oauthclients) {
    if (error) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: error.details}});
    }
    return res.status(200).json(oauthclients);
  });
}

function created(req, res) {
  OAuthClient.find({creator: req.user._id}).sort('-created').exec(function(error, oauthclients) {
    if (error) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: error.details}});
    }
    return res.status(200).json(oauthclients);
  });
}

function create(req, res) {
  if (!req.user) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }
  var oauthClientData = req.body;
  oauthClientData.creator = req.user;

  var oauthclient = new OAuthClient(oauthClientData);
  oauthclient.save(function(error, client) {
    if (error) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: error.details}});
    }
    return res.status(201).json(client);
  });
}

function get(req, res) {
  OAuthClient.findById(req.params.id, function(error, oauthclient) {
    if (error) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: error.details}});
    }
    if (!oauthclient) {
      return res.status(404).json({error: {code: 404, message: 'Not Found', details: 'Oauth Client does not exist'}});
    }
    return res.status(200).json(oauthclient);
  });
}

function remove(req, res) {
  OAuthClient.findByIdAndRemove(req.params.id, function(error, oauthclient) {
    if (error) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: error.details}});
    }
    if (!oauthclient) {
      return res.status(404).json({error: {code: 404, message: 'Not Found', details: 'Oauth Client does not exist'}});
    }
    return res.status(200).json(oauthclient);
  });
}

module.exports = {
  list: list,
  create: create,
  created: created,
  get: get,
  remove: remove
};
