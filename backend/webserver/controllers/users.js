const { promisify } = require('util');
const Q = require('q');
const userModule = require('../../core').user;
const imageModule = require('../../core').image;
const logger = require('../../core').logger;
const ObjectId = require('mongoose').Types.ObjectId;
const denormalizeUser = require('../denormalize/user').denormalize;
const userSearch = require('../../core/user/search');

const updateUserProfile = promisify(userModule.updateProfile);

module.exports = {
  getProfileAvatar,
  getTargetUserAvatar,
  getProfilesByQuery,
  logmein,
  logout,
  postProfileAvatar,
  profile,
  provision,
  updatePassword,
  updateTargetUserAvatar,
  updateTargetUserEmails,
  updateStates,
  updateUserProfileOnReq,
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

function updateTargetUserAvatar(req, res) {
  // assign our domain object to "domain" property of request object (by load domain middleware)
  // causes error "domain.enter is not a function" when process data stream (imageModule.recordAvatar function) on nodejs 8.
  // The reason is request object is an instance of EventEmitter that uses domain module to handle IO errors.
  // However, the domain module is deprecated (https://nodejs.org/api/domain.html)
  // Note: it does not cause error on nodejs 9.11.2
  delete req.domain;

  const avatarId = new ObjectId();

  Q.denodeify(imageModule.recordAvatar)(
    avatarId,
    req.query.mimetype.toLowerCase(),
    {
      creator: {
        objectType: 'user',
        id: req.targetUser._id
      }
    },
    req
  )
    .then(storedBytes => {
      const size = parseInt(req.query.size, 10);

      if (storedBytes !== size) {
        return res.status(412).json({
          error: {
            code: 412,
            message: 'Precondition Failed',
            details: `Avatar size given by user agent is ${size} and avatar size returned by storage system is ${storedBytes}`
          }
        });
      }

      const targetUser = req.targetUser;

      targetUser.avatars.push(avatarId);
      targetUser.currentAvatar = avatarId;

      return Q.denodeify(userModule.update)(targetUser);
    })
    .then(() => res.status(200).json({ _id: avatarId }))
    .catch(err => {
      let details = 'Error while updating user avatar';

      switch (err.code) {
        case 1:
          details = `${details}: failed to store avatar`;
          break;
        case 2:
          details = `${details}: failed to process avatar`;
      }

      logger.error(details, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: details
        }
      });
    });
}
/**
 * Return a handler of updating user profile
 *
 * @param {String} property define the property that stores the target user on request
 * @returns {Function}
 */
function updateUserProfileOnReq(property) {
  return (req, res) => {
    const targetUser = req[property];

    updateUserProfile(targetUser, _buildNewProfile(req.body))
      .then(updatedUser => denormalizeUser(updatedUser))
      .then(denormalizedUser => res.status(200).json(denormalizedUser))
      .catch(err => {
        const details = `Error while updating profile of user ${targetUser.id}`;

        logger.error(details, err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details
          }
        });
      });
  };
}

function _buildNewProfile(data) {
  const editableFields = [
    'firstname',
    'lastname',
    'job_title',
    'service',
    'building_location',
    'office_location',
    'main_phone',
    'description'
  ];

  const profile = {};

  editableFields.forEach(field => {
    const value = data[field];

    if (value === null) {
      profile[field] = '';
    } else if (typeof value !== 'undefined') {
      profile[field] = value;
    }
  });

  return profile;
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
  req.logging.log('/api/user: start of controller init');
  if (!req.user) {
    req.logging.log('/api/user: response code 404 sent to user-agent');

return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  const denormalizeOption = {
    includeConfigurations: true,
    includePrivateData: true,
    includeIsPlatformAdmin: true,
    includeIsFollowing: true,
    includeFollow: true
  };

  req.logging.log('/api/user: end of controller init');

  denormalizeUser(req.user, denormalizeOption)
    .then(denormalized => res.status(200).json(denormalized))
    .then(() => req.logging.log('/api/user: response sent to user-agent'))
    .catch(e => req.logging.log(`/api/user: failed with error "${e && e.message}"`));
}

function postProfileAvatar(req, res) {
  const avatarId = new ObjectId();

  Q.denodeify(imageModule.recordAvatar)(
    avatarId,
    req.query.mimetype.toLowerCase(),
    {
      creator: {
        objectType: 'user',
        id: req.user._id
      }
    },
    req
  )
    .then(storedBytes => {
      const size = parseInt(req.query.size, 10);

      if (storedBytes !== size) {
        return res.status(412).json({
          error: {
            code: 412,
            message: 'Precondition Failed',
            details: `Avatar size given by user agent is ${size} and avatar size returned by storage system is ${storedBytes}`
          }
        });
      }

      const user = req.user;

      user.avatars.push(avatarId);
      user.currentAvatar = avatarId;

      return Q.denodeify(userModule.update)(user);
    })
    .then(() => res.status(200).json({ _id: avatarId }))
    .catch(err => {
      let details = 'Error while updating user avatar';

      switch (err.code) {
        case 1:
          details = `${details}: failed to store avatar`;
          break;
        case 2:
          details = `${details}: failed to process avatar`;
      }

      logger.error(details, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: details
        }
      });
    });
}

function getProfileAvatar(req, res) {
  if (!req.user) {
    return res.status(404).json({error: 404, message: 'Not found', details: 'User not found'});
  }

  if (!req.user.currentAvatar) {
    return _redirectToGeneratedAvatar(req, res, req.user);
  }

  Q.ninvoke(imageModule, 'getAvatar', req.user.currentAvatar, req.query.format)
    .spread((fileStoreMeta, readable) => {
      if (!readable) {
        logger.warn('Can not retrieve avatar stream for user %s', req.user._id);

        return _redirectToGeneratedAvatar(req, res, req.user);
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

      _redirectToGeneratedAvatar(req, res, req.user);
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
    return _redirectToGeneratedAvatar(req, res, req.targetUser);
  }

  Q.ninvoke(imageModule, 'getAvatar', req.targetUser.currentAvatar, req.query.format)
    .spread((fileStoreMeta, readable) => {
      if (!readable) {
        logger.warn('Can not retrieve avatar stream for user %s', req.targetUser._id);

        return _redirectToGeneratedAvatar(req, res, req.targetUser);
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

      _redirectToGeneratedAvatar(req, res, req.targetUser);
    });
}

function _redirectToGeneratedAvatar(req, res, user) {
  // keep req.query.size parameter when defined
  const size = req.query.size;
  const url = `/api/avatars?objectType=email&email=${user.preferredEmail}`;

  res.redirect(size ? `${url}&size=${size}` : url);
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

function updateTargetUserEmails(req, res) {
  const targetUser = req.targetUser;
  const emailAccount = targetUser.accounts.find(account => account.type === 'email');
  const emailsToUpdate = [...new Set(req.body)];

  emailAccount.preferredEmailIndex = emailsToUpdate.indexOf(targetUser.preferredEmail);
  emailAccount.emails = emailsToUpdate;

  userModule.update(targetUser, err => {
    if (err) {
      const details = 'Error while updating user emails';

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

function provision(req, res) {
  const { source } = req.query;
  const provider = userModule.provision.service.providers.get(source);

  return provider.provision({ data: req.body, domainId: req.domain._id })
    .then(provisionedUsers => Promise.all(provisionedUsers.map(user => denormalizeUser(user))))
    .then(denormalizedUsers => res.status(201).json(denormalizedUsers))
    .catch(error => {
      const details = `Error while provisioning users from ${source}`;

      logger.error(details, error);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}
