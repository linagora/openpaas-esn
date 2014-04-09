'use strict';

var emailAdresses = require('email-addresses');
var userModule = require('../../core').user;
var validator = require('validator');
var imageModule = require('../../core').image;
var acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
var uuid = require('node-uuid');
//
// Users controller
//

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
  res.redirect('/login');
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

  if (!req.body || !req.body.value) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'No value defined'}});
  }

  var validate = {
    firstname: function() {
      return validator.isAlpha(req.body.value) && validator.isLength(req.body.value, 1, 100);
    },
    lastname: function() {
      return validator.isAlpha(req.body.value) && validator.isLength(req.body.value, 1, 100);
    },
    job_title: function() {
      return !validator.isNull(req.body.value) && validator.isLength(req.body.value, 1, 100);
    },
    service: function() {
      return !validator.isNull(req.body.value) && validator.isLength(req.body.value, 1, 400);
    },
    building_location: function() {
      return !validator.isNull(req.body.value) && validator.isLength(req.body.value, 1, 400);
    },
    office_location: function() {
      return !validator.isNull(req.body.value) && validator.isLength(req.body.value, 1, 400);
    },
    main_phone: function() {
      return !validator.isNull(req.body.value) && validator.isLength(req.body.value, 1, 20);
    }
  };

  var parameter = req.params.attribute;

  if (!validate[parameter]) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Unknown parameter ' + parameter}});
  }

  if (!validate[parameter]()) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Invalid parameter value for ' + parameter + ' : ' + req.body.value}});
  }

  userModule.updateProfile(req.user, parameter, req.body.value, function(err) {
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
  var avatarId = uuid.v1();

  function updateUserProfile() {
    req.user.avatars.push(avatarId);
    req.user.defaultAvatar = avatarId;
    req.user.save(function(err, user) {
      if (err) {
        return res.json(500, {error: 500, message: 'Datastore failure', details: err.message});
      }
      return res.json(201, {_id: avatarId});
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

  imageModule.recordAvatar(avatarId, mimetype, {}, req, avatarRecordResponse);
}
module.exports.postProfileAvatar = postProfileAvatar;
