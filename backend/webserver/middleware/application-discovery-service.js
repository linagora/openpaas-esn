const logger = require('../../core/logger');
const validator = require('../../core/esn-config/validator');
const ADS = require('../../core/application-discovery-service');

module.exports = {
  applicationExists,
  canCreateSPA,
  validateConfigBody
};

function canCreateSPA(req, res, next) {
  const { id } = req.body;

  return ADS.getById(id)
    .then(config => config || {})
    .then(config => {
      if (config.id) {
        return sendValidationError(res, 'application or service already exists');
      }

      return next();
    });
}

function applicationExists(req, res, next) {
  const { spaId } = req.params;

  return ADS.getById(spaId)
    .then(config => config || {})
    .then(config => {
      if (config.id) {
        return next();
      }

      return sendValidationError(res, 'application or service not found');
    });
}

function validateConfigBody(req, res, next) {
  const config = req.body;

  validator
    .validate('core', 'applicationDiscoveryService', config)
    .then(result => {
      if (!result.ok) {
        return sendValidationError(res, `Bad format: ${result.message}`);
      }

      return next();
    })
    .catch(err => {
      const details = 'Error while validating theme data';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: details
        }
      });
    });
}

/**
 * Send an error message.
 *
 * @param {Response} res
 * @param {String} details
 */
function sendValidationError(res, details) {
  res.status(400).json({
    error: {
      code: 400,
      message: 'Bad Request',
      details
    }
  });
}
