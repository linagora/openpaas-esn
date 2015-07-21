'use strict';

var q = require('q');
var client = require('../proxy/http-client');
var PATH = 'addressbooks';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').local;
  var contactModule = dependencies('contact');
  var proxy = require('../proxy')(dependencies)(PATH);

  function getURL(req) {
    return [req.davserver, '/', PATH, req.url].join('');
  }

  function getContactUrl(req, bookId, contactId) {
    return [req.davserver, '/', PATH, '/', bookId, '/contacts/', contactId, '.vcf'].join('');
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

  function searchContacts(req, res) {

    function fetchContact(contact) {
      var options = {
        headers: {
          ESNToken: req.token && req.token.token ? req.token.token : ''
        },
        url: getContactUrl(req, req.params.bookId, contact._id)
      };
      return contactModule.lib.client.get(options).then(function(data) {
        return data;
      }, function(err) {
        logger.warn('Error while getting contact', err);
        return false;
      });
    }

    var options = {
      user: req.user._id,
      search: req.query.search
    };

    contactModule.lib.search.searchContacts(options, function(err, result) {
      if (err) {
        logger.error('Error while searching contacts', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while searching contacts'}});
      }

      var json = {
        '_links': {
          'self': {
            'href': req.originalUrl
          }
        },
        _embedded: {
          'dav:item': []
        }
      };

      if (!result || !result.list || result.list.length === 0) {
        res.header('X-ESN-Items-Count', 0);
        return res.json(200, json);
      }

      q.all(result.list.map(fetchContact)).then(function(vcards) {
        vcards.filter(function(e) {
          return e;
        }).forEach(function(vcard) {
          json._embedded['dav:item'].push({
            '_links': {
              'self': getContactUrl(req, req.params.bookId, vcard._id)
            },
            data: vcard
          });
        });
        res.header('X-ESN-Items-Count', result.total_count);
        return res.json(200, json);
      }, function(err) {
        logger.error('Error while getting contact details', err);
        return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Error while getting contact details'}});
      });
    });
  }

  function getContacts(req, res) {
    if (req.query.search) {
      return searchContacts(req, res);
    }

    defaultHandler(req, res);
  }

  return {
    getContact: getContact,
    getContacts: getContacts,
    searchContacts: searchContacts,
    updateContact: updateContact,
    deleteContact: deleteContact,
    defaultHandler: defaultHandler
  };

};
