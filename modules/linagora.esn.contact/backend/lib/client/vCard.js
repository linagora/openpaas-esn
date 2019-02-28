const Q = require('q');
const URL = require('url');
const davClient = require('../dav-client').rawClient;

const {
  ADDRESSBOOK_ROOT_PATH,
  HEADER_VCARD_JSON
} = require('./constants');

module.exports = (dependencies, options = {}) => {
  const {
    ESNToken,
    user,
    addressbookHome,
    addressbookName,
    davServerUrl
  } = options;

  const { getDavEndpoint, checkResponse } = require('./utils')(dependencies, { davServerUrl });

  return cardId => {
    return {
      create,
      get,
      list,
      move,
      remove,
      update
    };

    /**
     * Create new vcard
     * @param  {Object} vcard The vcard to be created
     *
     * @return {Promise}
     */
    function create(vcard) {
      const method = 'PUT';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getVCardUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            body: vcard
          }, checkResponse(deferred, method, 'Error while creating contact in DAV'));

          return deferred.promise;
        });
    }

    /**
     * Get a vcard
     * @return {Promise}
     */
    function get() {
      const method = 'GET';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getVCardUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true
          }, checkResponse(deferred, method, 'Error while getting contact from DAV'));

          return deferred.promise;
        });
    }

    /**
     * Get list of vcards
     * @param  {Object} query Contains limit, offset, sort, userId, modifiedBefore
     * @return {Promise}
     */
    function list(query = {}) {
      const method = 'GET';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getParentUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            query
          }, checkResponse(deferred, method, 'Error while getting contacts from DAV'));

          return deferred.promise;
        });
    }

    /**
     * Move a vcard
     * @param  {String} destAddressbook The address book to move contact to
     *
     * @return {Promise}
     */
    function move(destAddressbook) {
      const method = 'MOVE';

      return getDavEndpoint()
        .then(davEndpoint => {
          const vcardUrl = `${davEndpoint}/${ADDRESSBOOK_ROOT_PATH}/${addressbookHome}/${addressbookName}/${cardId}.vcf`;
          const davBaseUri = URL.parse(davEndpoint).pathname;
          const headers = {
            ESNToken,
            Destination: `${davBaseUri}${destAddressbook}`
          };

          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url: vcardUrl,
            json: true
          }, checkResponse(deferred, method, 'Error while moving contact on DAV'));

          return deferred.promise;
        });
    }

    /**
     * Remove a vcard
     * @return {Promise}
     */
    function remove() {
      const method = 'DELETE';
      const headers = {
        ESNToken
      };

      return _getVCardUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true
          }, checkResponse(deferred, method, 'Error while deleting contact on DAV'));

          return deferred.promise;
        });
    }

    /**
     * Update a vcard
     * @param  {Object} contact The vcard to be updated
     *
     * @return {Promise}
     */
    function update(vcard) {
      const method = 'PUT';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getVCardUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            body: vcard
          }, checkResponse(deferred, method, 'Error while updating contact on DAV'));

          return deferred.promise;
        });
    }

    function _getVCardUrl() {
      return getDavEndpoint(user)
        .then(davEndpoint => `${davEndpoint}/${ADDRESSBOOK_ROOT_PATH}/${addressbookHome}/${addressbookName}/${cardId}.vcf`);
    }

    function _getParentUrl() {
      return getDavEndpoint(user)
        .then(davEndpoint => `${davEndpoint}/${ADDRESSBOOK_ROOT_PATH}/${addressbookHome}/${addressbookName}.json`);
    }
  };
};

