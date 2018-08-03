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
  getTargetUserAvatar,
  getProfilesByQuery,
  logmein,
  logout,
  postProfileAvatar,
  profile,
  updatePassword,
  updateProfile,
  updateTargetUserProfile,
  updateStates,
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

  Q.denodeify(userModule.updateProfile)(req.user, _buildNewProfile(req.body))
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
 * Update profile of a specific user {req.targetUser}.
 *
 * @param {Request} req   - Request object contains targetUser
 * @param {Response} res  - Response object
 */
function updateTargetUserProfile(req, res) {
  if (!req.body) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'No value defined'
      }
    });
  }

  Q.denodeify(userModule.updateProfile)(req.targetUser, _buildNewProfile(req.body))
    .then(updatedUser => denormalizeUser(updatedUser))
    .then(denormalizedUser => res.status(200).json(denormalizedUser))
    .catch(err => {
      const details = `Error while updating profile of user ${req.targetUser.id}`;

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

function _buildNewProfile(data) {
  return {
    firstname: data.firstname || '',
    lastname: data.lastname || '',
    job_title: data.job_title || '',
    service: data.service || '',
    building_location: data.building_location || '',
    office_location: data.office_location || '',
    main_phone: data.main_phone || '',
    description: data.description || ''
  };
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

    userModule.update(req.user, function(err) {
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
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.user.currentAvatar) {
    return _redirectToGeneratedAvatar(req.user, res);
  }

  Q.ninvoke(imageModule, 'getAvatar', req.user.currentAvatar, req.query.format)
    .spread((fileStoreMeta, readable) => {
      if (!readable) {
        logger.warn('Can not retrieve avatar stream for user %s', req.user._id);

        return _redirectToGeneratedAvatar(req.user, res);
      }

      if (!fileStoreMeta) {
        return readable.pipe(res.status(200));
      }

      if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
        return res.status(304).end();
      }

      res.header('Last-Modified', fileStoreMeta.uploadDate);
      readable.pipe(res.status(200));
    })
    .catch(err => {
      logger.warn('Can not get user avatar: %s', err.message);

      _redirectToGeneratedAvatar(req.user, res);
    });
}

/**
 * Get avatar of a specific user {req.targetUser}.
 *
 * @param {Request} req   - Request object contains targetUser
 * @param {Response} res  - Response object
 */
function getTargetUserAvatar(req, res) {
  if (!req.targetUser.currentAvatar) {
    return _redirectToGeneratedAvatar(req.targetUser, res);
  }

  Q.ninvoke(imageModule, 'getAvatar', req.targetUser.currentAvatar, req.query.format)
    .spread((fileStoreMeta, readable) => {
      if (!readable) {
        logger.warn('Can not retrieve avatar stream for user %s', req.targetUser._id);

        return _redirectToGeneratedAvatar(req.targetUser, res);
      }

      if (!fileStoreMeta) {
        return readable.pipe(res.status(200));
      }

      if (req.headers['if-modified-since'] && Number(new Date(req.headers['if-modified-since']).setMilliseconds(0)) === Number(fileStoreMeta.uploadDate.setMilliseconds(0))) {
        return res.status(304).end();
      }

      res.header('Last-Modified', fileStoreMeta.uploadDate);
      readable.pipe(res.status(200));
    })
    .catch(err => {
      logger.warn('Can not get user avatar: %s', err.message);

      _redirectToGeneratedAvatar(req.targetUser, res);
    });
}

function _redirectToGeneratedAvatar(user, res) {
  res.redirect(`/api/avatars?objectType=email&email=${user.preferredEmail}`);
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

function updateStates(req, res) {
  userModule.updateStates(req.params.uuid, req.body, err => {
    if (err) {
      const details = 'Error while updating user states';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    }

    res.status(204).end();
  });
}
