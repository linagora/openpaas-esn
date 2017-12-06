'use strict';

const Q = require('q');
const userModule = require('../../core').user;
const imageModule = require('../../core').image;
const acceptedImageTypes = ['image/jpeg', 'image/gif', 'image/png'];
const logger = require('../../core').logger;
const ObjectId = require('mongoose').Types.ObjectId;
const denormalizeUser = require('../denormalize/user').denormalize;
const userSearch = require('../../core/user/search');

module.exports = {
  getProfileAvatar,
  getProfilesByQuery,
  logmein,
  logout,
  postProfileAvatar,
  profile,
  updatePassword,
  updateProfile,
  user
};

/**
 * Log the user in. The user should already be loaded in the request from a middleware.
 */
function logmein(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).send('User not set');
  }

  return res.redirect('/');
}

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

/**
 * Get a user profile.
 *
 * @param {request} req
 * @param {response} res
 */
function profile(req, res) {
  var uuid = req.params.uuid;
  const denormalizeOptions = {
    includeIsFollowing: true,
    includeFollow: true,
    includePrivateData: String(req.user._id) === uuid,
    user: req.user
  };

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

    denormalizeUser(user, denormalizeOptions)
      .then(denormalized => res.status(200).json(denormalized));
  });
}

/**
 * Get users profile.
 *
 * @param {request} req
 * @param {response} res
 */
function getProfilesByQuery(req, res) {
  let getUsers;
  let errorMessage;

  if (req.query.email) {
    const email = req.query.email;

    errorMessage = `Error while finding users by email ${email}`;
    getUsers = _findUsersByEmail(email);
  } else {
    const options = {
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
      not_in_collaboration: req.query.not_in_collaboration
    };

    errorMessage = 'Error while searching users';
    getUsers = Q.ninvoke(userSearch, 'search', options);
  }

  const denormalizeUsers = users => users.map(user => denormalizeUser(user, { user: req.user }));

  getUsers
    .then(result => Q.all(denormalizeUsers(result.list))
    .then(denormalizedUsers => {
      res.header('X-ESN-Items-Count', result.total_count);
      res.status(200).json(denormalizedUsers);
    }))
    .catch(err => {
      logger.error(errorMessage, err);

      res.status(500).json({
        error: 500,
        message: 'Server Error',
        details: errorMessage
      });
    });
}

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

  Q.denodeify(userModule.updateProfile)(req.user, newProfile)
    .then(updatedUser => denormalizeUser(updatedUser))
    .then(denormalizedUser => res.status(200).json(denormalizedUser))
    .catch(err => {
      const details = `Error while updating profile of user ${req.user.id}`;

      logger.error(details, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

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

  const denormalizeOption = {
    includeConfigurations: true,
    includePrivateData: true,
    includeIsPlatformAdmin: true,
    includeIsFollowing: true,
    includeFollow: true
  };

  denormalizeUser(req.user, denormalizeOption).then(denormalized => res.status(200).json(denormalized));
}

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

    userModule.recordUser(req.user, function(err) {
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

function getProfileAvatar(req, res) {
  function redirectToGeneratedAvatar(req, res) {
    return res.redirect(`/api/avatars?objectType=email&email=${req.user.preferredEmail}`);
  }

  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.user.currentAvatar) {
    return redirectToGeneratedAvatar(req, res);
  }

  imageModule.getAvatar(req.user.currentAvatar, req.query.format, function(err, fileStoreMeta, readable) {
    if (err) {
      logger.warn('Can not get user avatar : %s', err.message);

      return redirectToGeneratedAvatar(req, res);
    }

    if (!readable) {
      logger.warn('Can not retrieve avatar stream for user %s', req.user._id);

      return redirectToGeneratedAvatar(req, res);
    }

    if (!fileStoreMeta) {
      res.status(200);

      return readable.pipe(res);
    }

    if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
      return res.status(304).end();
    }

    res.header('Last-Modified', fileStoreMeta.uploadDate);
    res.status(200);

    return readable.pipe(res);
  });
}

/**
 * Find users by email.
 *
 * @param {string} email
 */
function _findUsersByEmail(email) {
  return Q.ninvoke(userModule, 'findUsersByEmail', email)
    .then(users => {
      const result = {
        total_count: users.length,
        list: users
      };

      return result;
    });
}
