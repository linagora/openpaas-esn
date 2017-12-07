'use strict';

var q = require('q');
var ICAL = require('@linagora/ical.js');
var davClient = require('../dav-client').rawClient;
var PATH = 'addressbooks';
var DEFAULT_ADDRESSBOOK_NAME = 'contacts';
var VCARD_JSON = 'application/vcard+json';

var VALID_HTTP_STATUS = {
  GET: [200],
  PUT: [200, 201, 204],
  POST: [200, 201],
  DELETE: [204],
  PROPFIND: [200]
};

module.exports = function(dependencies, options) {
  var logger = dependencies('logger');
  var davServerUtils = dependencies('davserver').utils;
  var searchClient = require('../search')(dependencies);

  var ESNToken = options.ESNToken;
  var davServerUrl = options.davserver;
  var user = options.user;

  function _getDavEndpoint(callback) {
    if (davServerUrl) {
      return callback(davServerUrl);
    }

    return davServerUtils.getDavEndpoint(user, function(davEndpoint) {
      davServerUrl = davEndpoint; // cache to be reused
      callback(davEndpoint);
    });
  }

  function checkResponse(deferred, method, errMsg) {
    var status = VALID_HTTP_STATUS[method];

    return function(err, response, body) {
      if (err) {
        logger.error(errMsg, err);
        return deferred.reject(err);
      }

      if (status && status.indexOf(response.statusCode) < 0) {
        logger.error('Bad HTTP status', response.statusCode, body);
        return deferred.reject(new Error('Bad response from DAV API'));
      }

      deferred.resolve({ response: response, body: body });
    };
  }

  function searchContacts(searchOptions) {
    var deferred = q.defer();

    function vcard(bookId, bookName, cardId) {
      return addressbookHome(bookId).addressbook(bookName).vcard(cardId);
    }

    searchClient.searchContacts(searchOptions, function(err, result) {
      if (err) {
        return deferred.reject(err);
      }
      var output = {
        total_count: result.total_count,
        current_page: result.current_page,
        results: []
      };

      if (!result.list || result.list.length === 0) {
        return deferred.resolve(output);
      }
      // this promise always resolve
      q.all(result.list.map(function(contact, index) {
        var bookId = contact._source.bookId;
        var bookName = contact._source.bookName;
        var contactId = contact._id;

        return vcard(bookId, bookName, contactId).get().then(function(data) {
          output.results[index] = {
            contactId: contactId,
            bookId: bookId,
            bookName: bookName,
            response: data.response,
            body: data.body
          };
        }, function(err) {
          output.results.push({
            contactId: contactId,
            bookId: bookId,
            bookName: bookName,
            err: err
          });
        });
      })).then(function() {
        deferred.resolve(output);
      });
    });

    return deferred.promise;
  }

  /**
   * The addressbookHome API
   *
   * @param  {string} bookHome the addressbook home (the user id in the ESN case)
   * @return {Object}
   */
  function addressbookHome(bookHome) {

    function getAddressBookHomeUrl(callback) {
      _getDavEndpoint(function(davEndpoint) {
        callback([davEndpoint, PATH, bookHome + '.json'].join('/'));
      });
    }

    /**
     * The addressbook API.
     *
     * @param {String} name - The addressbook name
     * @returns {{list: list, search: search, vcard: vcard}}
     */
    function addressbook(name) {

      name = name || DEFAULT_ADDRESSBOOK_NAME;

      function getBookUrl(callback) {
        _getDavEndpoint(function(davEndpoint) {
          callback([davEndpoint, PATH, bookHome, name + '.json'].join('/'));
        });
      }

      /**
       * Create new addressbook
       * @param  {Object} addressbook The addressbook json to be created
       *
       * @return {Promise}
       */
      function create(addressbook) {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getAddressBookHomeUrl(function(url) {
          davClient({
            method: 'POST',
            headers: headers,
            url: url,
            json: true,
            body: addressbook
          }, checkResponse(deferred, 'POST', 'Error while creating addressbook in DAV'));
        });

        return deferred.promise;
      }

      /**
       * Get all addressbooks of current user
       * @return {Promise}
       */
      function list() {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getAddressBookHomeUrl(function(url) {
          davClient({
            method: 'GET',
            headers: headers,
            url: url,
            json: true
          }, checkResponse(deferred, 'GET', 'Error while getting addressbook list in DAV'));
        });

        return deferred.promise;
      }

      /**
       * Get an addressbook
       * @return {Promise}
       */
      function get() {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        var properties = {
          '{DAV:}displayname': 'dav:name',
          '{urn:ietf:params:xml:ns:carddav}addressbook-description': 'carddav:description',
          '{DAV:}acl': 'dav:acl',
          '{http://open-paas.org/contacts}type': 'type'
        };

        getBookUrl(function(url) {
          davClient({
            method: 'PROPFIND',
            headers: headers,
            url: url,
            json: true,
            body: {
              properties: Object.keys(properties)
            }
          }, function(err, response, body) {
            var newBody = body;
            if (!err && response.statusCode === 200) {
              newBody = {
                _links: {
                  self: { href: url }
                }
              };
              Object.keys(properties).forEach(function(key) {
                newBody[properties[key]] = body[key];
              });
            }
            checkResponse(deferred, 'PROPFIND', 'Error while getting an addressbook from DAV')(err, response, newBody);
          });
        });

        return deferred.promise;
      }

      /**
       * The vcard API
       *
       * @param cardId
       * @returns {{get: get, create: create, del: del, update: update}}
       */
      function vcard(cardId) {

        function getVCardUrl(callback) {
          _getDavEndpoint(function(davEndpoint) {
            callback([davEndpoint, PATH, bookHome, name, cardId + '.vcf'].join('/'));
          });
        }

        /**
         * Get a vcard
         * @return {Promise}
         */
        function get() {
          var deferred = q.defer();
          var headers = {
            ESNToken: ESNToken,
            accept: VCARD_JSON
          };

          getVCardUrl(function(url) {
            davClient({
              headers: headers,
              url: url,
              json: true
            }, checkResponse(deferred, 'GET', 'Error while getting contact from DAV'));
          });

          return deferred.promise;
        }

        /**
         * Create new vcard
         * @param  {Object} contact The contact vcard to be created
         *
         * @return {Promise}
         */
        function create(vcard) {
          var deferred = q.defer();
          var headers = {
            ESNToken: ESNToken,
            accept: VCARD_JSON
          };

          getVCardUrl(function(url) {
            davClient({
              method: 'PUT',
              headers: headers,
              url: url,
              json: true,
              body: vcard
            }, checkResponse(deferred, 'PUT', 'Error while creating contact in DAV'));
          });

          return deferred.promise;
        }

        /**
         * Update a vcard
         * @param  {Object} contact The contact vcard to be updated
         *
         * @return {Promise}
         */
        function update(vcard) {
          var deferred = q.defer();
          var headers = {
            ESNToken: ESNToken,
            accept: VCARD_JSON
          };

          getVCardUrl(function(url) {
            davClient({
              method: 'PUT',
              headers: headers,
              url: url,
              json: true,
              body: vcard
            }, checkResponse(deferred, 'PUT', 'Error while updating contact on DAV'));
          });

          return deferred.promise;
        }

        /**
         * Remove a vcard
         * @return {Promise}
         */
        function remove() {
          var deferred = q.defer();
          var headers = {
            ESNToken: ESNToken
          };

          getVCardUrl(function(url) {
            davClient({
              method: 'DELETE',
              headers: headers,
              url: url,
              json: true
            }, checkResponse(deferred, 'DELETE', 'Error while deleting contact on DAV'));
          });

          return deferred.promise;
        }

        /**
         * Remove multiple contacts from DAV
         * @param  {Object} options Contains:
         *                               + modifiedBefore: timestamp in seconds
         * @return {Promise} Resolve an array of removed contacts object
         *                           informations contains:
         *                               + cardId: the contact ID,
         *                               + data: object contain response and body if success
         *                               + error: error if failure
         */
        function removeMultiple(options) {
          if (!options || !options.hasOwnProperty('modifiedBefore')) {
            return q.reject(new Error('options.modifiedBefore is required'));
          }
          var query = {
            modifiedBefore: options.modifiedBefore
          };
          return list(query)
            .then(function(data) {
              var body = data.body;
              if (body && body._embedded && body._embedded['dav:item']) {
                logger.debug('Removing %s contacts from DAV', body._embedded['dav:item'].length);
                return q.all(body._embedded['dav:item'].map(function(davItem) {
                    var cardId = (new ICAL.Component(davItem.data)).getFirstPropertyValue('uid');
                    return vcard(cardId).remove().then(function(data) {
                      return { cardId: cardId, data: data };
                    }, function(err) {
                      logger.error('Failed to delete contact', cardId, err);
                      return { cardId: cardId, error: err };
                    });
                  }));
              } else {
                return q.reject(new Error('Error while deleting multiple contacts'));
              }
            });
        }

        /**
         * Get list of vcards
         * @param  {Object} query Contains limit, offset, sort, userId, modifiedBefore
         * @return {Promise}
         */
        function list(query) {
          var deferred = q.defer();
          var headers = {
            ESNToken: ESNToken,
            accept: VCARD_JSON
          };

          getBookUrl(function(url) {
            davClient({
              method: 'GET',
              headers: headers,
              url: url,
              json: true,
              query: query || {}
            }, checkResponse(deferred, 'GET', 'Error while getting contacts from DAV'));
          });

          return deferred.promise;
        }

        /**
         * Search vcards
         * @param  {Object} options Contains search, userId, limit and page
         * @return {promise}         Resolve an object with:
         *                                   - total_count:
         *                                   - current_page:
         *                                   - results: an array of objects with:
         *                                       + contactId: the ID of found contact
         *                                       + response: HTTP response from DAV
         *                                       + body: vcard data if statusCode is 2xx
         *                                       + err: error object failed to fetch contact
         */
        function search(options) {
          var searchOptions = {
            bookId: bookHome,
            bookName: name,
            search: options.search,
            userId: options.userId,
            limit: options.limit,
            page: options.page
          };
          return searchContacts(searchOptions);
        }

        return {
          get: get,
          create: create,
          remove: remove,
          removeMultiple: removeMultiple,
          update: update,
          list: list,
          search: search
        };
      }

      return {
        create: create,
        list: list,
        get: get,
        vcard: vcard
      };
    }

    /**
     * Search contacts in all the addressbooks of this addressbook home Id
     */
    function search(options) {
      var searchOptions = {
        bookId: bookHome,
        search: options.search,
        userId: options.userId,
        limit: options.limit,
        page: options.page
      };
      return searchContacts(searchOptions);
    }

    return {
      addressbook: addressbook,
      search: search
    };
  }

  return {
    addressbookHome: addressbookHome
  };

};
