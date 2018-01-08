const logger = require('../../core/logger');
const esnConfig = require('../../core/esn-config');

module.exports = {
  isEnabled
};

function isEnabled(req, res, next) {
  esnConfig('login').inModule('core').get()
    .then(config => {
      const isResetPasswordEnabled = config && config.resetpassword;

      if (isResetPasswordEnabled) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          response: 'Forbidden',
          details: 'password reset feature is currently disabled'
        }
      });
    })
    .catch(err => {
      const details = 'unable to get login configuration';

      logger.error(details, err);

      return res.status(500).json({
        error: {
          code: 500,
          response: 'Server Error',
          details
        }
      });
    });
}
