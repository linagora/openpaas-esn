const CONSTANTS = require('../../lib/constants');

module.exports = (dependencies, lib) => {
  const logger = dependencies('logger');
  const { db } = dependencies('helpers');
  const userModule = dependencies('user');

  return {
    getUserStatus,
    getUsersStatus
  };

  function denormalize(userId, status) {
    const result = {_id: userId, status: getConnectedStatus(status)};

    if (status && status.last_active) {
      result.last_active = status.last_active;
    }

    return Promise.resolve(result);
  }

  function _getUserIdFromEmail(email, callback) {
    return userModule.findByEmail(email, callback);
  }

  function getConnectedStatus(status) {
    return !!status && (Date.now() - status.last_active) < CONSTANTS.DISCONNECTED_DELAY ? CONSTANTS.STATUS.CONNECTED : CONSTANTS.STATUS.DISCONNECTED;
  }

  function getUserStatus(req, res) {
    if (!db.isValidObjectId(req.params.id)) {
      // we think here req.params.id is the mail of the user
      _getUserIdFromEmail(req.params.id, (err, user) => {
        if (err) {
          logger.error(`Error while getting user ${req.params.id} status`, err);

          return res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: `Error while fetching user status for user ${req.params.id}`
            }
          });
        }

        if (!user) {
          return res.status(404).json({
            error: {
              code: 404,
              message: 'Not Found',
              details: `${req.params.id} not found`
            }
          });
        }

        req.params.id = user._id;

        return getUserStatus(req, res);
      });
    } else {
      lib.userStatus.getStatus(req.params.id)
        .then(denormalize.bind(null, req.params.id))
        .then(status => res.status(200).json(status))
        .catch(err => {
          logger.error(`Error while getting user ${req.params.id} status`, err);

          res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: `Error while fetching user status for user ${req.params.id}`
            }
          });
        });
    }
  }

  function getUsersStatus(req, res) {
    const ids = req.body.map(id => (db.isValidObjectId(id) ? id : undefined)).filter(Boolean);

    lib.userStatus.getStatuses(ids)
      .then(result => Promise.all(result.map(userStatus => denormalize(userStatus._id, userStatus))))
      .then(status => res.status(200).json(status))
      .catch(err => {
        logger.error('Error while getting users status', err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while fetching user statuses'
          }
        });
      });
    }
};
