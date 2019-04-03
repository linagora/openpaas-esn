const logger = require('../../core/logger');
const validator = require('../../core/esn-config/validator');

module.exports = {
  validateWriteBody
};

function validateWriteBody(req, res, next) {
  const config = req.body;

  validator
    .validate('core', 'themes', config)
    .then(result => {
      if (!result.ok) {
        const details = `Bad theme format: ${result.message}`;

        return res.status(400).json({
          error: {
            code: 400,
            message: 'Bad Request',
            details
          }
        });
      }
      next();
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
