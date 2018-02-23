'use strict';

module.exports = dependencies => {
  const { AVAILABLE_ADDRESSBOOK_TYPES } = dependencies('contact').lib.constants;

  return {
    validateAddressbookCreation
  };

  function validateAddressbookCreation(req, res, next) {
    if (!req.body.type) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook type is required'
        }
      });
    }

    if (AVAILABLE_ADDRESSBOOK_TYPES.indexOf(req.body.type) === -1) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook type is not supported'
        }
      });
    }

    next();
  }
};
