'use strict';

var q = require('q');
var davClient = require('../dav-client').rawClient;
var PATH = 'addressbooks';
var VCARD_JSON = 'application/vcard+json';

module.exports = function(dependencies, options) {
  var logger = dependencies('logger');
  var davServerUtils = dependencies('davserver').utils;
  var ESNToken = options.ESNToken;

  /**
   * The addressbook APIs
   * @param  {string} bookId the addressbook ID
   * @return {Object}
   */
  return function(bookId) {

    function getContactUrl(contactId, callback) {
      davServerUtils.getDavEndpoint(function(davServerUrl) {
        callback([davServerUrl, PATH, bookId, 'contacts', contactId + '.vcf'].join('/'));
      });
    }


    function getBookUrl(callback) {
      davServerUtils.getDavEndpoint(function(davServerUrl) {
        callback([davServerUrl, PATH, bookId, 'contacts.json'].join('/'));
      });
    }

    function contacts(contactId) {

      /**
       * Get list of contacts
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
          }, function(err, response, body) {
            if (err) {
              logger.error('Error while getting contacts from DAV', err);
              deferred.reject(err);
            } else {
              deferred.resolve({ response: response, body: body });
            }
          });
        });

        return deferred.promise;
      }

      /**
       * Get a contact from DAV server
       * @return {Promise}
       */
      function get() {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getContactUrl(contactId, function(url) {
          davClient({
            headers: headers,
            url: url,
            json: true
          }, function(err, response, body) {
            if (err) {
              logger.error('Error while getting contact from DAV', err);
              deferred.reject(err);
            } else {
              deferred.resolve({ response: response, body: body });
            }
          });
        });

        return deferred.promise;
      }

      /**
       * Create new contact
       * @param  {Object} contact The contact vcard to be created
       *
       * @return {Promise}
       */
      function create(contact) {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getContactUrl(contactId, function(url) {
          davClient({
            method: 'PUT',
            headers: headers,
            url: url,
            json: true,
            body: contact
          }, function(err, response, body) {
            if (err) {
              logger.error('Error while creating contact on DAV', err);
              deferred.reject(err);
            } else {
              deferred.resolve({ response: response, body: body });
            }
          });
        });

        return deferred.promise;
      }


      /**
       * Update a contact
       * @param  {Object} contact The contact vcard to be updated
       *
       * @return {Promise}
       */
      function update(contact) {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken,
          accept: VCARD_JSON
        };

        getContactUrl(contactId, function(url) {
          davClient({
            method: 'PUT',
            headers: headers,
            url: url,
            json: true,
            body: contact
          }, function(err, response, body) {
            if (err) {
              logger.error('Error while updating contact on DAV', err);
              deferred.reject(err);
            } else {
              deferred.resolve({ response: response, body: body });
            }
          });
        });

        return deferred.promise;
      }


      /**
       * Delete a contact
       * @return {Promise}
       */
      function del() {
        var deferred = q.defer();
        var headers = {
          ESNToken: ESNToken
        };

        getContactUrl(contactId, function(url) {
          davClient({
            method: 'DELETE',
            headers: headers,
            url: url,
            json: true
          }, function(err, response, body) {
            if (err) {
              logger.error('Error while deleting contact on DAV', err);
              deferred.reject(err);
            } else {
              deferred.resolve({ response: response, body: body });
            }
          });
        });

        return deferred.promise;
      }

      return {
        list: list,
        get: get,
        create: create,
        update: update,
        del: del
      };
    }

    return {
      contacts: contacts
    };
  };


};
