const { check, checkWithCause, getRegisteredServiceNames } = require('../../core/health-check');
const logger = require('../../core/logger');

module.exports = {
  getHealthStatus,
  getAvailableServices
};

function getHealthStatus(req, res) {
  const requestServices = (req.query.services && req.query.services.split(',') || []).map(service => service.toLowerCase());
  let checking = check;
  if (req.isAuthorized) {
    checking = checkWithCause;
  }

  return checking(requestServices)
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

function getAvailableServices(_req, res) {
  res.status(200).json({
    services: getRegisteredServiceNames()
  });
}

