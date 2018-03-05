'use strict';

const q = require('q');
const PATH = 'addressbooks';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const localpubsub = pubsub.local;
  const globalpubsub = pubsub.global;
  const contactModule = dependencies('contact');
  const CONSTANTS = contactModule.lib.constants;
  const proxy = require('../proxy')(dependencies)(PATH);
  const avatarHelper = require('./avatarHelper')(dependencies);

  return {
    createAddressbook,
    defaultHandler,
    deleteContact,
    getAddressbook,
    getAddressbooks,
    getContact,
    getContacts,
    getContactsFromDAV,
    searchContacts,
    removeAddressbook,
    updateAddressbook,
    updateContact
  };

  function createAddressbook(req, res) {
    const options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    const addressbook = {
      id: req.body.id,
      'dav:name': req.body.name,
      'carddav:description': req.body.description,
      'dav:acl': ['dav:read', 'dav:write'],
      type: req.body.type
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook()
      .create(addressbook)
      .then(response => res.status(201).json(response.body))
      .catch(err => {
        const details = 'Error while creating addressbook on DAV server';

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

  function removeAddressbook(req, res) {
    const options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .remove()
      .then(() => res.status(204).json())
      .catch(err => {
        const details = 'Error while removing addressbook on DAV server';

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

  function updateAddressbook(req, res) {
    const options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };
    const modified = {
      'dav:name': req.body.name,
      'carddav:description': req.body.description
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .update(modified)
      .then(() => res.status(204).json())
      .catch(err => {
        const details = 'Error while updating addressbook on DAV server';

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

  function getContactUrl(req, bookHome, bookName, contactId) {
    return [req.davserver, '/', PATH, '/', bookHome, '/', bookName, '/', contactId, '.vcf'].join('');
  }

  function getContactsFromDAV(req, res) {
    var options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .vcard()
      .list(req.query)
      .then(function(data) {
        var body = data.body;
        var response = data.response;

        // inject text avatar if there's no avatar
        if (body && body._embedded && body._embedded['dav:item']) {
          q.all(body._embedded['dav:item'].map(function(davItem) {
            return avatarHelper.injectTextAvatar(req.user, req.params.bookHome, req.params.bookName, davItem.data)
              .then(function(newData) {
                davItem.data = newData;
              });
          })).then(function() {
            return res.status(response.statusCode).json(body);
          });
        } else {
          return res.status(response.statusCode).json(body);
        }
      }, function(err) {
        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err || 'Error while getting contacts from DAV server'
          }
        });
      });
  }

  function getContact(req, res) {
    var options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .vcard(req.params.contactId)
      .get()
      .then(function(data) {
        avatarHelper.injectTextAvatar(req.user, req.params.bookHome, req.params.bookName, data.body).then(function(newBody) {
          res.set('ETag', data.response.headers.etag);

          return res.status(data.response.statusCode).json(newBody);
        });
      }, function(err) {
        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err || 'Error while getting contact from DAV server'
          }
        });
      });
  }

  function updateContact(req, res) {
    var headers = req.headers || {};

    headers.ESNToken = req.token && req.token.token ? req.token.token : '';

    // Workaround to avoid frontend accidentally save text avatar to backend
    req.body = avatarHelper.removeTextAvatar(req.body);
    // Since req.body has been modified so contentLength will not be the same
    // Delete it to avoid issule relating to contentLength while sending request
    delete headers['content-length'];

    var options = {
      ESNToken: headers.ESNToken,
      davserver: req.davserver
    };

    if (!headers['if-match']) {
      contactModule.lib.client(options)
        .addressbookHome(req.params.bookHome)
        .addressbook(req.params.bookName)
        .vcard(req.params.contactId)
        .create(req.body)
        .then(function(data) {
          avatarHelper.injectTextAvatar(req.user, req.params.bookHome, req.params.bookName, req.body).then(function(newBody) {
            localpubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_ADDED).forward(globalpubsub, {
              contactId: req.params.contactId,
              bookId: req.params.bookHome,
              bookName: req.params.bookName,
              vcard: newBody,
              user: req.user
            });
          });
          res.status(data.response.statusCode).json(data.body);
        }, function(err) {
          var msg = 'Error while creating contact on DAV server';

          logger.error(msg, err);

          res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: msg
            }
          });
        });
    } else {
      return proxy.handle({
        onError: function(response, data, req, res, callback) {
          logger.error('Error while updating contact', req.params.contactId);
          return callback(null, data);
        },

        onSuccess: function(response, data, req, res, callback) {
          logger.debug('Success while updating contact %s', req.params.contactId);
          localpubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).forward(globalpubsub, {
            contactId: req.params.contactId,
            bookId: req.params.bookHome,
            bookName: req.params.bookName,
            vcard: req.body,
            user: req.user
          });

          return callback(null, data);
        },
        json: true
      })(req, res);
    }

  }

  function deleteContact(req, res) {

    return proxy.handle({
      onError: function(response, data, req, res, callback) {
        logger.error('Error while deleting contact', req.params.contactId);
        return callback(null, data);
      },

      onSuccess: function(response, data, req, res, callback) {
        logger.debug('Success while deleting contact %s', req.params.contactId);

        localpubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_DELETED).forward(globalpubsub, {
          contactId: req.params.contactId,
          bookId: req.params.bookHome,
          bookName: req.params.bookName
        });

        return callback(null, data);
      }
    })(req, res);
  }

  function defaultHandler(req, res) {
    proxy.handle()(req, res);
  }

  function searchContacts(req, res) {
    var ESNToken = req.token && req.token.token ? req.token.token : '';

    var options = {
      userId: req.user._id,
      search: req.query.search,
      limit: req.query.limit,
      page: req.query.page
    };

    var client = contactModule.lib.client({
      ESNToken: ESNToken,
      davserver: req.davserver
    }).addressbookHome(req.params.bookHome);

    if (req.params.bookName) {
      client = client.addressbook(req.params.bookName).vcard();
    }

    client.search(options).then(function(data) {
        var json = {
          _links: {
            self: {
              href: req.originalUrl
            }
          },
          _total_hits: data.total_count,
          _current_page: data.current_page,
          _embedded: {
            'dav:item': []
          }
        };
        res.header('X-ESN-Items-Count', data.total_count);

        var dataCleanResult = [];
        data.results.map(function(result) {
          if (result.err) {
            logger.error('The search cannot fetch contact', result.contactId, result.err);
            return;
          }
          var statusCode = result.response.statusCode;
          if (statusCode < 200 || statusCode > 299) {
            logger.warn('The search cannot fetch contact', result.contactId, 'status code', statusCode);
            return;
          }
          dataCleanResult.push(result);
        });

        q.all(dataCleanResult.map(function(result, index) {
          return avatarHelper.injectTextAvatar(req.user, result.bookId, result.bookName, result.body)
            .then(function(newVcard) {
              json._embedded['dav:item'][index] = {
                _links: {
                  self: {
                    href: getContactUrl(req, result.bookId, result.bookName, result.contactId)
                  }
                },
                data: newVcard
              };
            });
        })).then(function() {
          return res.status(200).json(json);
        });
      }, function(err) {
        logger.error('Error while searching contacts', err);
        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while searching contacts'
          }
        });
      });
  }

  function getContacts(req, res) {
    if (req.query.search) {
      return searchContacts(req, res);
    }

    getContactsFromDAV(req, res);
  }

  function getAddressbooks(req, res) {
    if (req.query.search) {
      return searchContacts(req, res);
    }

    var options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook()
      .list()
      .then(function(data) {
        res.status(200).json(data.body);
      }, function(err) {
        logger.error('Error while getting addressbook list', err);
        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while getting addressbook list'
          }
        });
      });
  }

  function getAddressbook(req, res) {
    var options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .get()
      .then(function(data) {
        res.status(200).json(data.body);
      }, function(err) {
        logger.error('Error while getting an addressbook', err);
        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while getting an addressbook'
          }
        });
      });
  }
};
