'use strict';

const q = require('q');
const URL = require('url');
const ICAL = require('@linagora/ical.js');
const davClient = require('../dav-client').rawClient;
const helper = require('../helper');

const PATH = 'addressbooks';
const DEFAULT_ADDRESSBOOK_NAME = 'contacts';
const VCARD_JSON = 'application/vcard+json';
const VALID_HTTP_STATUS = {
  GET: [200],
  PUT: [200, 201, 204],
  POST: [200, 201],
  DELETE: [204],
  PROPFIND: [200],
  PROPPATCH: [204]
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

  function searchContacts(bookHome, options) {
    const vcard = (bookHome, bookName, cardId) => addressbookHome(bookHome).addressbook(bookName).vcard(cardId);

    return addressbookHome(bookHome).addressbook().list()
      .then(data => {
        let addressbooks = data.body._embedded['dav:addressbook'];

        if (options.bookNames && options.bookNames.length) {
          addressbooks = _filterAddressbooksForSearch(addressbooks, options.bookNames);
        }

        const addressbooksToSearch = [];
        const mapping = {}; // To mapping between subscription address books and their sources

        addressbooks.forEach(addressbook => {
          const { bookHome, bookName } = helper.parseAddressbookPath(addressbook._links.self.href);

          if (addressbook['openpaas:source']) {
            const parsedSourcePath = helper.parseAddressbookPath(addressbook['openpaas:source']._links.self.href);

            mapping[`${parsedSourcePath.bookHome}/${parsedSourcePath.bookName}`] = mapping[`${parsedSourcePath.bookHome}/${parsedSourcePath.bookName}`] || {
              bookHome,
              bookName
            };

            addressbooksToSearch.push({
              bookHome: parsedSourcePath.bookHome,
              bookName: parsedSourcePath.bookName
            });
          } else {
            addressbooksToSearch.push({
              bookHome,
              bookName
            });
          }
        });

        const searchOptions = {
          search: options.search,
          limit: options.limit,
          page: options.page,
          addressbooks: addressbooksToSearch
        };

        return q.ninvoke(searchClient, 'searchContacts', searchOptions)
          .then(result => {
            const output = {
              total_count: result.total_count,
              current_page: result.current_page,
              results: []
            };

            if (!result.list || result.list.length === 0) {
              return output;
            }

            // this promise always resolve
            return q.all(result.list.map((contact, index) => {
              const bookId = contact._source.bookId;
              const bookName = contact._source.bookName;
              const contactId = contact._id;

              return vcard(bookId, bookName, contactId).get()
                .then(data => {
                  output.results[index] = {
                    contactId,
                    bookId,
                    bookName,
                    response: data.response,
                    body: data.body
                  };

                  if (mapping[`${bookId}/${bookName}`]) {
                    output.results[index]['openpaas:addressbook'] = mapping[`${bookId}/${bookName}`];
                  }
                }, err => {
                  output.results.push({
                    contactId,
                    bookId,
                    bookName,
                    err
                  });
                });
          }))
          .then(() => output);
      });
    });
  }

  function _filterAddressbooksForSearch(addressbooks, bookNames) {
    return addressbooks.map(addressbook => {
      const bookName = helper.parseAddressbookPath(addressbook._links.self.href).bookName;

      if (bookNames.indexOf(bookName) !== -1) {
        return addressbook;
      }
    }).filter(Boolean);
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
        const deferred = q.defer();
        const headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };
        const method = 'POST';

        getAddressBookHomeUrl(url => davClient({
          method,
          headers: headers,
          url,
          json: true,
          body: addressbook
        }, checkResponse(deferred, method, 'Error while creating addressbook in DAV')));

        return deferred.promise;
      }

      /**
       * Remove an addressbook
       *
       * @return {Promise}
       */
      function remove() {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getBookUrl(url => davClient({
          method: 'DELETE',
          headers: headers,
          url: url
        }, checkResponse(deferred, 'DELETE', 'Error while removing addressbook in DAV')));

        return deferred.promise;
      }

      /**
       * Update an addressbook
       *
       * @return {Promise}
       */
      function update(modified) {
        const deferred = q.defer();
        const headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getBookUrl(url => davClient({
          method: 'PROPPATCH',
          headers: headers,
          url: url,
          json: true,
          body: modified
        }, checkResponse(deferred, 'PROPPATCH', 'Error while updating addressbook in DAV')));

        return deferred.promise;
      }

      /**
       * Get all addressbooks of current user
       * @param  {Object} options Options for listing address books
       *
       * @return {Promise}
       */
      function list(options) {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getAddressBookHomeUrl(function(url) {
          const clientOptions = {
            method: 'GET',
            headers: headers,
            url: url,
            json: true
          };

          if (options && options.query) { clientOptions.query = options.query; }

          davClient(clientOptions, checkResponse(deferred, 'GET', 'Error while getting addressbook list in DAV'));
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
          '{http://open-paas.org/contacts}source': 'openpaas:source',
          '{http://open-paas.org/contacts}type': 'type',
          acl: 'acl'
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
        function search(options = {}) {
          options.bookNames = [name];

          return searchContacts(bookHome, options);
        }

        /**
         * Move a vcard
         * @param  {String} destAddressbook The address book to move contact to
         *
         * @return {Promise}
         */
        function move(destAddressbook) {
          const deferred = q.defer();

          _getDavEndpoint(davEndpoint => {
            const vcardUrl = [davEndpoint, PATH, bookHome, name, cardId + '.vcf'].join('/');
            const davBaseUri = URL.parse(davEndpoint).pathname;
            const headers = {
              ESNToken: ESNToken,
              Destination: `${davBaseUri}${destAddressbook}`
            };

            davClient({
              method: 'MOVE',
              headers: headers,
              url: vcardUrl,
              json: true
            }, checkResponse(deferred, 'MOVE', 'Error while moving contact on DAV'));
          });

          return deferred.promise;
        }

        return {
          create,
          get,
          list,
          move,
          remove,
          removeMultiple,
          search,
          update
        };
      }

      return {
        create,
        list,
        get,
        remove,
        update,
        vcard
      };
    }

    /**
     * Search contacts in all the addressbooks of this addressbook home Id
     */
    function search(options) {
      return searchContacts(bookHome, options);
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
