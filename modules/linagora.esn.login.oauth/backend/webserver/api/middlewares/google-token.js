'use strict';

module.exports = function(dependencies) {
  const getAccessTokenFn = require('./../../../lib/helpers/google')(dependencies).getAccessToken;
  const logger = dependencies('logger');

  return {
    getAccessToken
  };

  ////////////

  function getAccessToken(req, res, next) {
    getAccessTokenFn(req.body.serverAuthCode).then(accessToken => {
      req.body.access_token = accessToken;
      next();
    }, error => {
      logger.error('Problem while getting Google Access Token', error.message);
      res.status(500).json({error: {code: 500, message: 'Server error', details: error.message}});
    });
  }
};
