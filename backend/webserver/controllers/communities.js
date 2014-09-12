'use strict';

var communityModule = require('../../core/community');
var imageModule = require('../../core/image');
var uuid = require('node-uuid');
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var escapeStringRegexp = require('escape-string-regexp');

module.exports.loadDomainForCreate = function(req, res, next) {
  var domains = req.body.domain_ids;
  if (!domains) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Domain ids is mandatory'}});
  }
  if (domains.length === 0) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Domain id is mandatory'}});
  }
  req.params.uuid = domains[0];
  var domainController = require('./domains');
  return domainController.load(req, res, next);
};

module.exports.create = function(req, res) {

  var community = {
    title: req.body.title,
    creator: req.user._id,
    type: 'open',
    members: [{user: req.user._id}]
  };

  if (!community.title) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community title is mandatory'}});
  }

  if (!req.body.domain_ids) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Community domain is mandatory'}});
  }

  if (req.body.domain_ids.length === 0) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'At least a domain is required'}});
  }

  community.domain_ids = req.body.domain_ids;

  if (req.body.type) {
    community.type = req.body.type;
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
  var query = {};
  if (req.domain) {
    query.domain_ids = [req.domain._id];
  }

  if (req.param('creator')) {
    query.creator = req.param('creator');
  }

  if (req.param('title')) {
    var escapedString = escapeStringRegexp(req.param('title'));
    query.title = new RegExp('^' + escapedString + '$', 'i');
  }

  communityModule.query(query, function(err, response) {
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

module.exports.uploadAvatar = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.query.mimetype) {
    return res.json(400, {error: 400, message: 'Parameter missing', details: 'mimetype parameter is required'});
  }

  var mimetype = req.query.mimetype.toLowerCase();
  if (acceptedImageTypes.indexOf(mimetype) < 0) {
    return res.json(400, {error: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable'});
  }

  if (!req.query.size) {
    return res.json(400, {error: 400, message: 'Parameter missing', details: 'size parameter is required'});
  }

  var size = parseInt(req.query.size);
  if (isNaN(size)) {
    return res.json(400, {error: 400, message: 'Bad parameter', details: 'size parameter should be an integer'});
  }
  var avatarId = uuid.v1();

  function updateCommunityAvatar() {
    communityModule.updateAvatar(req.community, avatarId, function(err, update) {
      if (err) {
        return res.json(500, {error: 500, message: 'Datastore failure', details: err.message});
      }
      return res.json(200, {_id: avatarId});
    });
  }

  function avatarRecordResponse(err, storedBytes) {
    if (err) {
      if (err.code === 1) {
        return res.json(500, {error: 500, message: 'Datastore failure', details: err.message});
      } else if (err.code === 2) {
        return res.json(500, {error: 500, message: 'Image processing failure', details: err.message});
      } else {
        return res.json(500, {error: 500, message: 'Internal server error', details: err.message});
      }
    } else if (storedBytes !== size) {
      return res.json(412, {error: 412, message: 'Image size does not match', details: 'Image size given by user agent is ' + size +
        ' and image size returned by storage system is ' + storedBytes});
    }
    updateCommunityAvatar();
  }
  return imageModule.recordAvatar(avatarId, mimetype, {}, req, avatarRecordResponse);
};

module.exports.getAvatar = function(req, res) {
  if (!req.community) {
    return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
  }

  if (!req.community.avatar) {
    return res.redirect('/images/community.png');
  }

  imageModule.getAvatar(req.community.avatar, function(err, fileStoreMeta, readable) {
    if (err) {
      return res.json(500, {error: 500, message: 'Internal server error', details: err.message});
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.send(304);
    } else {
      res.header('Last-Modified', fileStoreMeta.uploadDate);
      res.status(200);
      return readable.pipe(res);
    }
  });
};

module.exports.getMine = function(req, res) {
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User is missing'}});
  }

  communityModule.query({'members.user': user._id}, function(err, communities) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(200, communities);
  });
};

module.exports.getMembers = function(req, res) {
  var community = req.community;

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  communityModule.getMembers(community, function(err, members) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.json(200, members || []);
  });
};

module.exports.getMember = function(req, res) {
  var community = req.community;
  var user = req.params.user_id;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'User id is missing'}});
  }

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  communityModule.isMember(community, user, function(err, result) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }

    if (result) {
      return res.json(200);
    }
    return res.send(404);
  });
};

module.exports.join = function(req, res) {
  var community = req.community;
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'The user_id parameter is missing'}});
  }
  var targetUser = req.params.user_id;

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  communityModule.join(community, user, targetUser, function(err) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.send(204);
  });
};

module.exports.leave = function(req, res) {
  var community = req.community;
  var user = req.user;

  if (!user) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'You must be logged in to access this resource'}});
  }

  if (!req.params || !req.params.user_id) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'The user_id parameter is missing'}});
  }
  var targetUser = req.params.user_id;

  if (!community) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Community is missing'}});
  }

  communityModule.leave(community, user, targetUser, function(err) {
    if (err) {
      return res.json(500, {error: {code: 500, message: 'Server Error', details: err.details}});
    }
    return res.send(204);
  });
};
