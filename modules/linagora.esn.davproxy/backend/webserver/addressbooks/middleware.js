'use strict';

module.exports = dependencies => {
  const { AVAILABLE_ADDRESSBOOK_TYPES } = dependencies('contact').lib.constants;

  return {
    requireDestinationInHeaders,
    validateAddressbookCreation
  };

  function validateAddressbookCreation(req, res, next) {
    if (!req.body.id) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook id is required'
        }
      });
    }

    if (!req.body.type) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook type is required'
        }
      });
    }

    if (!req.body.name) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook name is required'
        }
      });
    }

    if (Object.values(AVAILABLE_ADDRESSBOOK_TYPES).indexOf(req.body.type) === -1) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'Addressbook type is not supported'
        }
      });
    }

    if (req.body.type === AVAILABLE_ADDRESSBOOK_TYPES.SUBSCRIPTION) {
      if (!req.body['openpaas:source']) {
        return res.status(400).json({
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'openpaas:source is required for subscription'
          }
        });
      }

      delete req.body.type;
    }

    next();
  }

  function requireDestinationInHeaders(req, res, next) {
    if (!req.headers.destination) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'The destination header is required'
        }
      });
    }

    next();
  }
};
