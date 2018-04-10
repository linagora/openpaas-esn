'use strict';

module.exports = dependencies => {
  const { AVAILABLE_ADDRESSBOOK_TYPES } = dependencies('contact').lib.constants;
  const contactModule = dependencies('contact');
  const logger = dependencies('logger');

  return {
    requireDestinationInHeaders,
    validateAddressbookCreation,
    validateBookHome,
    validateBookNamesForSearch
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

  function validateBookNamesForSearch(req, res, next) {
    if (!req.query.search) {
      return next();
    }

    const ESNToken = req.token && req.token.token ? req.token.token : '';
    const client = contactModule.lib.client({
      ESNToken: ESNToken,
      davserver: req.davserver
    }).addressbookHome(req.user._id);
    const bookNames = req.query.bookName ? req.query.bookName.split(',') : [];
    const contactHelper = contactModule.lib.helper;

    client.addressbook().list().then(validate, err => {
      logger.error('Error while getting address book list', err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Error while searching contact'
        }
      });
    });

    function validate(data) {
      const allAddressbookNames = data.body._embedded['dav:addressbook']
        .map(addressbook => addressbook._links.self.href)
        .map(contactHelper.parseAddressbookPath)
        .map(parsedHrefs => parsedHrefs.bookName);

      if (!bookNames.length) {
        req.query.bookNames = allAddressbookNames;
      } else {
        req.query.bookNames = bookNames.filter(bookName => allAddressbookNames.indexOf(bookName) > -1);
      }

      next();
    }
  }

  function validateBookHome(req, res, next) {
    if (req.query.search && req.params.bookHome !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'User do not have the required privileges for this bookHome'
        }
      });
    }

    next();
  }
};
