const dbHelper = require('../../helpers').db;
const TechnicalUser = require('mongoose').model('TechnicalUser');
const logger = require('../../core/logger');

module.exports = {
  load
};

function load(req, res, next) {
  if (!dbHelper.isValidObjectId(req.params.technicalUserId)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad request',
        details: 'Invalid technical user id' }
      });
  }

  TechnicalUser.findById(req.params.technicalUserId)
    .then(technicalUser => {
      if (!technicalUser) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not Found',
            details: `No technical user found for id: ${req.params.technicalUserId}`
          }
        });
      }

      req.technicalUser = technicalUser;
      next();
    }).catch(err => {
      const details = 'Unable to load technical user';

      logger.error(details, err);
      res.status(500).json({
        error: 500,
        message: 'Server Error',
        details
      });
   });
}
