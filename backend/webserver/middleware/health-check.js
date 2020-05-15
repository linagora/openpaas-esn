const logger = require('../../core/logger');
const corePlatformAdmin = require('../../core/platformadmin');

module.exports = {
  checkAPIAuthorization
};

function checkAPIAuthorization(req, res, next) {
  req.isAuthorized = false;
  if (req.isAuthenticated()) {
    return requirePlatformAdmin(req, res, next);
  }
  return next();
}

function requirePlatformAdmin(req, _res, next) {
  corePlatformAdmin.isPlatformAdmin(req.user.id).then(isPlatformAdmin => {
    if (isPlatformAdmin) {
      req.isAuthorized = true;
      return next();
    } else {
      return next();
    }
  }, err => {
    const details = 'Error while checking platformadmin';

    logger.debug(details, err);
    return next();
  });
}
