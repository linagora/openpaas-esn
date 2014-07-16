'use strict';

var communityModule = require('../../core/community');

module.exports.create = function(req, res) {

  var community = {
    title: req.body.title,
    creator: req.user._id
  };

  if (!community.title) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community title is mandatory'}});
  }

  if (req.body.description) {
    community.description = req.body.description;
  }

  communityModule.save(community, function(err, saved) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community save error', details: err}});
    }
    return res.json(201, saved);
  });
};

module.exports.list = function(req, res) {
  communityModule.query({}, function(err, response) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community list failed', details: err}});
    }
    return res.json(200, response);
  });
};

module.exports.load = function(req, res, next) {
  communityModule.load(req.params.id, function(err, community) {
    if (err) {
      return next(err);
    }
    if (!community) {
      return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
    }
    req.community = community;
    return next();
  });
};

module.exports.get = function(req, res) {
  if (req.community) {
    return res.json(200, req.community);
  }
  return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
};

module.exports.delete = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  communityModule.delete(req.community, function(err) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community delete failed', details: err}});
    }
    return res.json(204);
  });
};

module.exports.uploadImage = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  return res.json(500, {error: 500, message: 'Server error', details: 'Not implemented'});
};

module.exports.getImage = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.community.image) {
    return res.send(404);
  }

  return res.json(500, {error: 500, message: 'Server error', details: 'Not implemented'});
};
