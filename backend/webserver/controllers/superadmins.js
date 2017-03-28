const logger = require('../../core/logger');
const coreSuperAdmin = require('../../core/superadmin');
const coreUserDenormalize = require('../../core/user/denormalize');
const dbHelper = require('../../helpers').db;

module.exports = {
  getAllSuperAdmins,
  createSuperAdmin,
  removeSuperAdmin
};

function getAllSuperAdmins(req, res) {
  coreSuperAdmin
    .getAllSuperAdminUsers()
    .then(users => users.map(user => coreUserDenormalize.denormalize(user)))
    .then(users => users.map(user => ({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.preferredEmail
    })))
    .then(users => res.status(200).json(users))
    .catch(err => {
      const details = 'Error while listing all superadmins';

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

function createSuperAdmin(req, res) {
  const { type, data } = req.body;
  const addSuperAdminHandlers = {
    email: coreSuperAdmin.addSuperAdminByEmail,
    id: coreSuperAdmin.addSuperAdminById
  };

  const addSuperAdmin = addSuperAdminHandlers[type];

  if (!addSuperAdmin) {
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

  addSuperAdmin(data).then(() => {
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

    const details = 'Error while adding superadmin';

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

function removeSuperAdmin(req, res) {
  const { type, data } = req.query;
  const removeSuperAdminHandlers = {
    email: coreSuperAdmin.removeSuperAdminByEmail,
    id: coreSuperAdmin.removeSuperAdminById
  };

  const removeSuperAdmin = removeSuperAdminHandlers[type];

  if (!removeSuperAdmin) {
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

  removeSuperAdmin(data).then(() => {
    res.status(204).end();
  }, err => {
    const details = 'Error while removing superadmin';

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
