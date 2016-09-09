'use strict';

var userModule = require('../../core').user;
var imageModule = require('../../core').image;
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var logger = require('../../core').logger;
var ObjectId = require('mongoose').Types.ObjectId;
var denormalizeUser = require('../denormalize/user').denormalize;

/**
 * Log the user in. The user should already be loaded in the request from a middleware.
 */
function logmein(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).send('User not set');
  }
  return res.redirect('/');
}
module.exports.logmein = logmein;

/**
 * Logout the current user
 *
 * @param {request} req
 * @param {response} res
 */
function logout(req, res) {
  req.logout();
  res.redirect('/');
}
module.exports.logout = logout;

/**
 * Get a user profile.
 *
 * @param {request} req
 * @param {response} res
 */
function profile(req, res) {
  var uuid = req.params.uuid;
  if (!uuid) {
    return res.status(400).json({error: {code: 400, message: 'Bad parameters', details: 'User ID is missing'}});
  }

  userModule.get(uuid, function(err, user) {
    if (err) {
      return res.status(500).json({
        error: 500,
        message: 'Error while loading user ' + uuid,
        details: err.message
      });
    }

    if (!user) {
      return res.status(404).json({
        error: 404,
        message: 'User not found',
        details: 'User ' + uuid + ' has not been found'
      });
    }

    denormalizeUser(user, {user: req.user, doNotKeepPrivateData: String(req.user._id) !== uuid})
      .then(function(denormalized) {
        res.status(200).json(denormalized);
      });
  });
}
module.exports.profile = profile;

/**
 * Update a parameter value in the current user profile
 *
 * @param {Request} req
 * @param {Response} res
 */

function updateProfile(req, res) {
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.body) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'No value defined'});
  }

  var newProfile = {
    firstname: req.body.firstname || '',
    lastname: req.body.lastname || '',
    job_title: req.body.job_title || '',
    service: req.body.service || '',
    building_location: req.body.building_location || '',
    office_location: req.body.office_location || '',
    main_phone: req.body.main_phone || '',
    description: req.body.description || ''
  };

  userModule.updateProfile(req.user, newProfile, function(err, profile) {
    if (err) {
      return res.status(500).json({error: 500, message: 'Server Error', details: err.message});
    }
    return res.status(200).json(profile);
  });
}
module.exports.updateProfile = updateProfile;

/**
 * Update the password in the current user profile
 *
 * @param {Request} req
 * @param {Response} res
 */

function updatePassword(req, res) {
  if (!req.body && !req.body.password) {
    return res.status(400).json({error: 400, message: 'Bad Request', details: 'No password defined'});
  }

  userModule.updatePassword(req.user, req.body.password, function(err) {
    if (err) {
      return res.status(500).json({error: 500, message: 'Server Error', details: err.message});
    }
    return res.status(200).end();
  });
}
module.exports.updatePassword = updatePassword;

/**
 * Returns the current authenticated user
 *
 * @param {Request} req
 * @param {Response} res
 */
function user(req, res) {
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  denormalizeUser(req.user).then(function(denormalized) {
    res.status(200).json(denormalized);
  });
}
module.exports.user = user;

function postProfileAvatar(req, res) {
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }
  if (!req.query.mimetype) {
    return res.status(400).json({error: 400, message: 'Parameter missing', details: 'mimetype parameter is required'});
  }
  var mimetype = req.query.mimetype.toLowerCase();
  if (acceptedImageTypes.indexOf(mimetype) < 0) {
    return res.status(400).json({error: 400, message: 'Bad parameter', details: 'mimetype ' + req.query.mimetype + ' is not acceptable'});
  }
  if (!req.query.size) {
    return res.status(400).json({error: 400, message: 'Parameter missing', details: 'size parameter is required'});
  }
  var size = parseInt(req.query.size, 10);
  if (isNaN(size)) {
    return res.status(400).json({error: 400, message: 'Bad parameter', details: 'size parameter should be an integer'});
  }
  var avatarId = new ObjectId();

  function updateUserProfile() {
    req.user.avatars.push(avatarId);
    req.user.currentAvatar = avatarId;

    userModule.recordUser(req.user, function(err, user) {
      if (err) {
        return res.status(500).json({error: 500, message: 'Datastore failure', details: err.message});
      }
      return res.status(200).json({_id: avatarId});
    });
  }

  function avatarRecordResponse(err, storedBytes) {
    if (err) {
      if (err.code === 1) {
        return res.status(500).json({error: 500, message: 'Datastore failure', details: err.message});
      } else if (err.code === 2) {
        return res.status(500).json({error: 500, message: 'Image processing failure', details: err.message});
      } else {
        return res.status(500).json({error: 500, message: 'Internal server error', details: err.message});
      }
    } else if (storedBytes !== size) {
      return res.status(412).json({error: 412, message: 'Image size does not match', details: 'Image size given by user agent is ' + size +
                           ' and image size returned by storage system is ' + storedBytes});
    }
    updateUserProfile();
  }

  var metadata = {};
  if (req.user) {
    metadata.creator = {objectType: 'user', id: req.user._id};
  }

  imageModule.recordAvatar(avatarId, mimetype, metadata, req, avatarRecordResponse);
}

module.exports.postProfileAvatar = postProfileAvatar;

function getProfileAvatar(req, res) {
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.user.currentAvatar) {
    return res.redirect('/images/user.png');
  }

  imageModule.getAvatar(req.user.currentAvatar, req.query.format, function(err, fileStoreMeta, readable) {
    if (err) {
      logger.warn('Can not get user avatar : %s', err.message);
      return res.redirect('/images/user.png');
    }

    if (!readable) {
      logger.warn('Can not retrieve avatar stream for user %s', req.user._id);
      return res.redirect('/images/user.png');
    }

    if (!fileStoreMeta) {
      res.status(200);
      return readable.pipe(res);
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.status(304).end();
    } else {
      res.header('Last-Modified', fileStoreMeta.uploadDate);
      res.status(200);
      return readable.pipe(res);
    }
  });
}
module.exports.getProfileAvatar = getProfileAvatar;
