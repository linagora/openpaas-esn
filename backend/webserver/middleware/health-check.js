const logger = require('../../core/logger');
const corePlatformAdmin = require('../../core/platformadmin');

module.exports = {
  checkAPIAuthorization,
  validateParameters
};

function checkAPIAuthorization(req, res, next) {
  req.isAuthorizedAsPlatformAdmin = false;
  if (req.isAuthenticated()) {
    return requirePlatformAdmin(req, res, next);
  }
  return next();
}

function requirePlatformAdmin(req, res, next) {
  corePlatformAdmin.isPlatformAdmin(req.user.id).then(isPlatformAdmin => {
    if (isPlatformAdmin) {
      req.isAuthorizedAsPlatformAdmin = true;
      return next();
    } else {
      return next();
    }
  }, err => {
    const details = 'Error while checking platformadmin';

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

function validateParameters(req, res, next) {
  if (!req.params.name) {
    return res.status(400).json({
      error: {
        message: 'Bad Parameter',
        details: 'Name parameter is required'
      }
    });
  }
  return next();
}
