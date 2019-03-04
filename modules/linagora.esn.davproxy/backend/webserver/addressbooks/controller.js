'use strict';

const q = require('q');
const PATH = 'addressbooks';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const contactModule = dependencies('contact');
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
    moveContact,
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
      'dav:acl': req.body.acl || ['dav:read', 'dav:write'],
      type: req.body.type,
      state: req.body.state,
      'openpaas:source': req.body['openpaas:source']
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
      'carddav:description': req.body.description,
      state: req.body.state
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

  function getContactUrl(davserver, bookHome, bookName, contactId) {
    return [davserver, '/', PATH, '/', bookHome, '/', bookName, '/', contactId, '.vcf'].join('');
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

        return callback(null, data);
      }
    })(req, res);
  }

  function defaultHandler(req, res) {
    proxy.handle()(req, res);
  }

  function getContacts(req, res) {
    if (req.query.search) {
      const options = {
        user: req.user,
        search: req.query.search,
        limit: req.query.limit,
        page: req.query.page,
        bookNames: [req.params.bookName],
        ESNToken: req.token && req.token.token ? req.token.token : '',
        davserver: req.davserver,
        originalUrl: req.originalUrl
      };

      return _searchContacts(req.params.bookHome, options)
        .then(result => {
          res.header('X-ESN-Items-Count', result.total_count);

          return res.status(200).json(result.data);
        })
        .catch(err => {
          const details = 'Error while searching contacts';

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

    getContactsFromDAV(req, res);
  }

  function moveContact(req, res) {
    const options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };
    const destAddressbook = req.headers.destination;

    contactModule.lib.client(options)
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .vcard(req.params.contactId)
      .move(destAddressbook)
      .then(data => {
        res.status(data.response.statusCode).json();
      })
      .catch(err => {
        const msg = 'Error while moving contact on DAV server';

        logger.error(msg, err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      });
  }

  function getAddressbooks(req, res) {
    if (req.query.search) {
      const options = {
        user: req.user,
        search: req.query.search,
        limit: req.query.limit,
        page: req.query.page,
        bookNames: req.query.bookName ? req.query.bookName.split(',') : [],
        ESNToken: req.token && req.token.token ? req.token.token : '',
        davserver: req.davserver,
        originalUrl: req.originalUrl
      };

      return _searchContacts(req.params.bookHome, options)
        .then(result => {
          res.header('X-ESN-Items-Count', result.total_count);

          return res.status(200).json(result.data);
        })
        .catch(err => {
          const details = 'Error while searching contacts';

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

    var options = {
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver
    };
    const client = contactModule.lib.client(options);

    client
      .addressbookHome(req.params.bookHome)
      .addressbook()
      .list({ query: req.query })
      .then(data =>
        q.all(
          data.body._embedded['dav:addressbook']
            .map(addressbook => _populateSubscriptionSource(client, addressbook))
        )
        .then(() => data)
      )
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
    const client = contactModule.lib.client(options);

    client
      .addressbookHome(req.params.bookHome)
      .addressbook(req.params.bookName)
      .get()
      .then(data => _populateSubscriptionSource(client, data.body))
      .then(
        body => res.status(200).json(body),
        err => {
          logger.error('Error while getting an addressbook', err.body || err);

          if (err.response.statusCode === 404) {
            return res.status(404).json({
              error: {
                code: 404,
                message: 'Not Found',
                details: `Addressbook ${req.params.bookName} is not found`
              }
            });
          }

          res.status(500).json({
            error: {
              code: 500,
              message: 'Server Error',
              details: 'Error while getting an addressbook'
            }
          });
        });
  }

  function _searchContacts(bookHome, options) {
    const clientOptions = {
      ESNToken: options.ESNToken,
      davserver: options.davserver
    };

    return contactModule.lib.client(clientOptions)
      .addressbookHome(bookHome)
      .search(options)
      .then(result => {
        const data = {
          _links: {
            self: {
              href: options.originalUrl
            }
          },
          _total_hits: result.total_count,
          _current_page: `${result.current_page}`,
          _embedded: {
            'dav:item': []
          }
        };

        return q.all(result.results.map((result, index) => {
          if (!result.body) {
            return;
          }

          return avatarHelper.injectTextAvatar(options.user, result.bookId, result.bookName, result.body)
            .then(newVcard => {
              data._embedded['dav:item'][index] = {
                _links: {
                  self: {
                    href: getContactUrl(options.davserver, result.bookId, result.bookName, result.contactId)
                  }
                },
                data: newVcard,
                'openpaas:addressbook': result['openpaas:addressbook']
              };
            });
        })).then(() => ({
          total_count: result.total_count,
          data
        }));
      });
  }

  function _populateSubscriptionSource(client, addressbook) {
    if (addressbook['openpaas:source']) {
      const parsedSourcePath = contactModule.lib.helper.parseAddressbookPath(addressbook['openpaas:source']);

      return client
        .addressbookHome(parsedSourcePath.bookHome)
        .addressbook(parsedSourcePath.bookName)
        .get()
        .then(data => {
          addressbook['openpaas:source'] = data.body;

          return addressbook;
        });
    }

    return q(addressbook);
  }
};
