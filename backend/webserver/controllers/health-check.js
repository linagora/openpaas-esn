const { check, checkWithDetails, getRegisteredServiceNames } = require('../../core/health-check');
const logger = require('../../core/logger');

module.exports = {
  getAllServices,
  getOneService,
  getAvailableServices
};

function getAllServices(req, res) {
  let checking = check;
  if (req.isAuthorizedAsPlatformAdmin) {
    checking = checkWithDetails;
  }

  return checking()
    .then(statuses => {
      res.status(200).json({
        checks: statuses
      });
    })
    .catch(err => {
      const details = 'Failed to do health check';

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

function getOneService(req, res) {
  let checking = check;
  if (req.isAuthorizedAsPlatformAdmin) {
    checking = checkWithDetails;
  }

  return checking([req.params.name.toLowerCase()])
    .then(results => {
      res.status(200).json(results[0]);
    })
    .catch(err => {
      const details = 'Failed to do health check';

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

function getAvailableServices(_req, res) {
  res.status(200).json({
    services: getRegisteredServiceNames()
  });
}

