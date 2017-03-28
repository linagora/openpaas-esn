const logger = require('../../core/logger');
const coreSuperAdmin = require('../../core/superadmin');

module.exports = {
  canCreateFirstSuperAdmin,
  requireSuperAdmin
};

function canCreateFirstSuperAdmin(req, res, next) {
  coreSuperAdmin.getAllSuperAdmins()
  .then(superadmins => {
    if (superadmins.length === 0) {
      next();
    } else {
      res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'To create another superadmin, you need to be a superadmin'
        }
      });
    }
  }, err => {
    const details = 'Error while checking first superadmin';

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

function requireSuperAdmin(req, res, next) {
  const user = req.user;

  coreSuperAdmin.isSuperAdmin(user.id).then(isSuperAdmin => {
    if (isSuperAdmin) {
      next();
    } else {
      res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'To perform this action, you need to be a superadmin'
        }
      });
    }
  }, err => {
    const details = 'Error while checking superadmin';

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
