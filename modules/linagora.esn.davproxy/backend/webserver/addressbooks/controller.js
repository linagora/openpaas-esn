'use strict';

var client = require('../proxy/http-client');
var PATH = 'addressbooks';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').local;
  var proxy = require('../proxy')(dependencies)(PATH);

  function getURL(req) {
    return req.davserver + '/' + PATH + req.url;
  }

  function getContact(req, res) {
    var headers = req.headers || {};
    headers.ESNToken = req.token && req.token.token ? req.token.token : '';

    client({headers: headers, url: getURL(req), json: true}, function(err, response, body) {
      if (err) {
        logger.error('Error while getting contact from DAV', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while getting contact from DAV server'}});
      }
      return res.json(response.statusCode, body);
    });
  }

  function updateContact(req, res) {
    var headers = req.headers || {};
    headers.ESNToken = req.token && req.token.token ? req.token.token : '';

    var create = true;
    if (headers['if-match']) {
      create = false;
    }

    delete headers['if-match'];

    client({method: 'PUT', body: req.body, headers: headers, url: getURL(req), json: true}, function(err, response, body) {
      if (err) {
        logger.error('Error while updating contact on DAV', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while updating contact on DAV server'}});
      }

      pubsub.topic(create ? 'contacts:contact:add' : 'contacts:contact:update').publish({contactId: req.params.contactId, bookId: req.params.bookId, vcard: req.body});

      return res.json(response.statusCode, body);
    });
  }

  function deleteContact(req, res) {

    return proxy.handle({
      onError: function(response, data, req, res, callback) {
        logger.error('Error while deleting contact', req.params.contactId);
        return callback(null, data);
      },

      onSuccess: function(response, data, req, res, callback) {
        logger.debug('Success while deleting contact %s', req.params.contactId);

        pubsub.topic('contacts:contact:delete').publish({contactId: req.params.contactId, bookId: req.params.bookId});

        return callback(null, data);
      }
    })(req, res);
  }

  function defaultHandler(req, res) {
    proxy.handle()(req, res);
  }

  return {
    getContact: getContact,
    updateContact: updateContact,
    deleteContact: deleteContact,
    defaultHandler: defaultHandler
  };

};
