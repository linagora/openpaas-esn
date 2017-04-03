const logger = require('../../core/logger');
const corePlatformAdmin = require('../../core/platformadmin');
const coreUserDenormalize = require('../../core/user/denormalize');
const dbHelper = require('../../helpers').db;

module.exports = {
  getAllPlatformAdmins,
  createPlatformAdmin,
  removePlatformAdmin
};

function getAllPlatformAdmins(req, res) {
  corePlatformAdmin
    .getAllPlatformAdminUsers()
    .then(users => users.map(user => coreUserDenormalize.denormalize(user)))
    .then(users => users.map(user => ({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.preferredEmail
    })))
    .then(users => res.status(200).json(users))
    .catch(err => {
      const details = 'Error while listing all platformadmins';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
}

function createPlatformAdmin(req, res) {
  const { type, data } = req.body;
  const addPlatformAdminHandlers = {
    email: corePlatformAdmin.addPlatformAdminByEmail,
    id: corePlatformAdmin.addPlatformAdminById
  };

  const addPlatformAdmin = addPlatformAdminHandlers[type];

  if (!addPlatformAdmin) {
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

  addPlatformAdmin(data).then(() => {
    res.status(204).end();
  }, err => {
    if (/no such user/.test(err.message)) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Not Found',
          details: `no such user with ${type} ${data}`
        }
      });
    }

    const details = 'Error while adding platformadmin';

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

function removePlatformAdmin(req, res) {
  const { type, data } = req.query;
  const removePlatformAdminHandlers = {
    email: corePlatformAdmin.removePlatformAdminByEmail,
    id: corePlatformAdmin.removePlatformAdminById
  };

  const removePlatformAdmin = removePlatformAdminHandlers[type];

  if (!removePlatformAdmin) {
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

  let isRemovingMySelf = false;

  if (type === 'id') {
    isRemovingMySelf = req.user.id === data;
  } else {
    isRemovingMySelf = req.user.emails.indexOf(data) > -1;
  }

  if (isRemovingMySelf) {
    return res.status(403).json({
      error: {
        code: 403,
        message: 'Forbidden',
        details: 'You cannot unset yourself'
      }
    });
  }

  removePlatformAdmin(data).then(() => {
    res.status(204).end();
  }, err => {
    const details = 'Error while removing platformadmin';

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
