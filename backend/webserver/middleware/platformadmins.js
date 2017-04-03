const logger = require('../../core/logger');
const corePlatformAdmin = require('../../core/platformadmin');

module.exports = {
  canCreateFirstPlatformAdmin,
  requirePlatformAdmin
};

function canCreateFirstPlatformAdmin(req, res, next) {
  corePlatformAdmin.getAllPlatformAdmins()
  .then(platformadmins => {
    if (platformadmins.length === 0) {
      next();
    } else {
      res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'To create another platformadmin, you need to be a platformadmin'
        }
      });
    }
  }, err => {
    const details = 'Error while checking first platformadmin';

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

function requirePlatformAdmin(req, res, next) {
  const user = req.user;

  corePlatformAdmin.isPlatformAdmin(user.id).then(isPlatformAdmin => {
    if (isPlatformAdmin) {
      next();
    } else {
      res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'To perform this action, you need to be a platformadmin'
        }
      });
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
