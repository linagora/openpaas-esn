'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    getUserStatus,
    setCurrentUserStatus
  };

  function getUserStatus(req, res) {
    lib.userStatus.get(req.params.id).then(status => {
      res.status(200).json({current_status: status});
    }).catch(err => {
      logger.error('Error while getting user %s status', req.params.id, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while fetching user status for user' + req.params.id
        }
      });
    });
  }

  function setCurrentUserStatus(req, res) {
    if (!req.body.value) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the user status'
        }
      });
    }

    lib.userStatus.set(req.user._id, req.body.value).then(() => {
      res.status(204).end();
    }).catch(err => {
      logger.error('Error while setting user %s status', req.user._id, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while setting user status for user' + req.params.id
        }
      });
    });
  }
};
