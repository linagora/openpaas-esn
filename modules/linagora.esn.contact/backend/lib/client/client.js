'use strict';

var q = require('q');
var davClient = require('../dav-client').rawClient;
var PATH = 'addressbooks';
var DEFAULT_ADDRESSBOOK_NAME = 'contacts';
var VCARD_JSON = 'application/vcard+json';

var VALID_HTTP_STATUS = {
  GET: [200],
  PUT: [200, 201],
  POST: [200, 201],
  DELETE: [204]
};

module.exports = function(dependencies, options) {
  var logger = dependencies('logger');
  var davServerUtils = dependencies('davserver').utils;
  var searchClient = require('../search')(dependencies);
  var ESNToken = options.ESNToken;

  function checkResponse(deferred, method, errMsg) {

    var status = VALID_HTTP_STATUS[method];
    return function(err, response, body) {
      if (err) {
        logger.error(errMsg, err);
        return deferred.reject(err);
      }

      if (status && status.indexOf(response.statusCode) < 0) {
        logger.error('Bad HTTP status', response.statusCode);
        return deferred.reject(new Error('Bad response from DAV API'));
      }

      deferred.resolve({ response: response, body: body });
    };
  }

  /**
   * The addressbookHome API
   *
   * @param  {string} bookHome the addressbook home (the user id in the ESN case)
   * @return {Object}
   */
  function addressbookHome(bookHome) {

    function getAddressBookHomeUrl(callback) {
      davServerUtils.getDavEndpoint(function(davServerUrl) {
        callback([davServerUrl, PATH, bookHome + '.json'].join('/'));
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
        davServerUtils.getDavEndpoint(function(davServerUrl) {
          callback([davServerUrl, PATH, bookHome, name + '.json'].join('/'));
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
       * The vcard API
       *
       * @param cardId
       * @returns {{get: get, create: create, del: del, update: update}}
       */
      function vcard(cardId) {

        function getVCardUrl(callback) {
          davServerUtils.getDavEndpoint(function(davServerUrl) {
            callback([davServerUrl, PATH, bookHome, name, cardId + '.vcf'].join('/'));
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
         * Delete a vcard
         * @return {Promise}
         */
        function del() {
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
         * Get list of vcards
         * @param  {Object} query Contains limit, offset, sort, userId
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
         *                                   		+ contactId: the ID of found contact
         *                                   		+ response: HTTP response from DAV
         *                                   		+ body: vcard data if statusCode is 2xx
         *                                   		+ err: error object failed to fetch contact
         */
        function search(options) {
          var deferred = q.defer();

          var searchOptions = {
            bookId: bookHome,
            search: options.search,
            userId: options.userId,
            limit: options.limit,
            page: options.page
          };

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
            // this promise allways resolve
            q.all(result.list.map(function(contact, index) {
              return vcard(contact._id).get().then(function(data) {
                output.results[index] = {
                  contactId: contact._id,
                  response: data.response,
                  body: data.body
                };
              }, function(err) {
                output.results.push({
                  contactId: contact._id,
                  err: err
                });
              });
            })).then(function() {
              deferred.resolve(output);
            });
          });

          return deferred.promise;
        }

        return {
          get: get,
          create: create,
          del: del,
          update: update,
          list: list,
          search: search
        };
      }

      return {
        create: create,
        list: list,
        vcard: vcard
      };
    }

    return {
      addressbook: addressbook
    };
  }

  return {
    addressbookHome: addressbookHome
  };

};
