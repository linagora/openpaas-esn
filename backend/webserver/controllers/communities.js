'use strict';

var communityModule = require('../../core/community');
var imageModule = require('../../core/image');
var uuid = require('node-uuid');
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];

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
    creator: req.user._id
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
  communityModule.query(query, function(err, response) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Community list failed', details: err}});
    }
    return res.json(200, response);
  });
};

module.exports.load = function(req, res, next) {
  communityModule.loadWithDomains(req.params.id, function(err, community) {
    if (err) {
      return next(err);
    }
    if (!community) {
      return res.json(404, {error: 404, message: 'Not found', details: 'Community not found'});
    }
    req.community = community;
    req.domain = community.domain_ids[0];
    req.domains = community.domain_ids;
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
