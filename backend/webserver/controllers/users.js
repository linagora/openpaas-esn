'use strict';

var emailAdresses = require('email-addresses');
var userModule = require('../../core').user;
var imageModule = require('../../core').image;
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var logger = require('../../core').logger;
var ObjectId = require('mongoose').Types.ObjectId;

function getEmailsFromPassportProfile(profile) {
  var emails = profile.emails
    .filter(function(email) {
      return (email && email.value && emailAdresses.parseOneAddress(email.value));
    })
    .map(function(email) { return email.value + ''; });
  return emails;
}

/**
 * Provision the user from the request, redirect to / once done.
 * When this controller method is called, it means that the authentication is already OK.
 *
 * @param {request} req
 * @param {response} res
 */
function provision(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    res.send(500, 'User not set');
  }

  var emails = getEmailsFromPassportProfile(req.user);
  if (!emails.length) {
    res.send(500, 'No valid email address found');
  }
  userModule.findByEmail(emails, function(err, user) {
    if (err) {
      return res.send(500, 'Unable to lookup user ' + emails + ': ' + err);
    } else if (user && user.emails) {
      return res.redirect('/');
    }

    userModule.provisionUser({emails: emails}, function(err, user) {
      if (err) {
        return res.send(500, 'Unable to provision user ' + req.user + ': ' + err);
      }
      return res.redirect('/');
    });
  });
}
module.exports.provision = provision;

/**
 * Log the user in. The user should already be loaded in the request from a middleware.
 */
function logmein(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, 'User not set');
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
    return res.json(400, {error: {code: 400, message: 'Bad parameters', details: 'User ID is missing'}});
  }

  userModule.get(uuid, function(err, user) {
    if (err) {
      return res.json(500, {
        error: 500,
        message: 'Error while loading user ' + uuid,
        details: err.message
      });
    }

    if (!user) {
      return res.json(404, {
        error: 404,
        message: 'User not found',
        details: 'User ' + uuid + ' has not been found'
      });
    }
    return res.json(200, user);
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
    return res.json(404, {error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.body) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'No value defined'}});
  }

  //these empty function are necessary to check if the paramter is known
  var validate = {
    firstname: function() {
      return true;
    },
    lastname: function() {
      return true;
    },
    job_title: function() {
      return true;
    },
    service: function() {
      return true;
    },
    building_location: function() {
      return true;
    },
    office_location: function() {
      return true;
    },
    main_phone: function() {
      return true;
    }
  };

  var parameter = req.params.attribute;

  if (!validate[parameter]) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Unknown parameter ' + parameter}});
  }

  userModule.updateProfile(req.user, parameter, req.body.value || '', function(err) {
    if (err) {
      return res.json(500, {error: 500, message: 'Server Error', details: err.message});
    }
    return res.json(200);
  });
}
module.exports.updateProfile = updateProfile;

/**
 * Returns the current authenticated user
 *
 * @param {Request} req
 * @param {Response} res
 */
function user(req, res) {
  if (!req.user) {
    return res.json(404, {error: 404, message: 'Not found', details: 'User not found'});
  }
  return res.json(200, req.user);
}
module.exports.user = user;

function postProfileAvatar(req, res) {
  if (!req.user) {
    return res.json(404, {error: 404, message: 'Not found', details: 'User not found'});
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
  var avatarId = new ObjectId();

  function updateUserProfile() {
    req.user.avatars.push(avatarId);
    req.user.currentAvatar = avatarId;

    userModule.recordUser(req.user, function(err, user) {
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
    return res.json(404, {error: 404, message: 'Not found', details: 'User not found'});
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
      return res.send(304);
    } else {
      res.header('Last-Modified', fileStoreMeta.uploadDate);
      res.status(200);
      return readable.pipe(res);
    }
  });
}
module.exports.getProfileAvatar = getProfileAvatar;

function load(req, res, next) {
  if (req.params.uuid) {
    userModule.get(req.params.uuid, function(err, user) {
      req.user = user;
      next();
    });
  } else {
    next();
  }
}
module.exports.load = load;
