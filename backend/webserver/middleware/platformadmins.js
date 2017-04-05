const logger = require('../../core/logger');
const corePlatformAdmin = require('../../core/platformadmin');
const dbHelper = require('../../helpers').db;

module.exports = {
  requirePlatformAdmin,
  validateBodyData
};

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

function validateBodyData(req, res, next) {
  const { type, data } = req.body;

  if (['id', 'email'].indexOf(type) === -1) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: `Unsupport data type: ${type}`
      }
    });
  }

  if (type === 'id' && !dbHelper.isValidObjectId(data)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: `${data} is not valid User ID`
      }
    });
  }

  next();
}
