const { checkWithDetails, getRegisteredServiceNames, generateGlobalStatus, STATUSES } = require('../../core/health-check');
const logger = require('../../core/logger');

module.exports = {
  getAllServices,
  getOneService,
  getAvailableServices
};

function getAllServices(req, res) {
  return checkWithDetails()
    .then(statuses => {
      const globalStatus = generateGlobalStatus(statuses);
      const returnedObject = {
        status: globalStatus,
        checks: req.isAuthorizedAsPlatformAdmin ? statuses : undefined
      };
      if (globalStatus === STATUSES.HEALTHY) {
        return res.status(200).json(returnedObject);
      }
      return res.status(503).json(returnedObject);
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
  return checkWithDetails([req.params.name.toLowerCase()])
    .then(results => {
      if (results[0].status === STATUSES.NOT_FOUND) {
        return res.status(404).json(results[0]);
      }
      if (results[0].status === STATUSES.UNHEALTHY) {
        return res.status(503).json(results[0]);
      }
      return res.status(200).json(results[0]);
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
