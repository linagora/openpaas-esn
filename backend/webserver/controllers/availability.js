const coreAvailability = require('../../core/availability');
const logger = require('../../core/logger');

module.exports = {
  checkAvailability
};

function checkAvailability(req, res) {
  const { resourceId, resourceType } = req.query;
  const checker = coreAvailability[resourceType];

  if (!checker) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: `Unsupported resourceType: ${resourceType}`
      }
    });
  }

  checker.isAvailable(resourceId)
    .then(result => res.status(200).json(result))
    .catch(err => {
      const details = `Error while checking availability of resouce ${resourceType} with ID ${resourceId}`;

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
