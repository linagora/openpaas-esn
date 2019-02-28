const Q = require('q');
const ICAL = require('@linagora/ical.js');
const davClient = require('../dav-client').rawClient;
const {
  DEFAULT_ADDRESSBOOK_NAME,
  ADDRESSBOOK_ROOT_PATH,
  HEADER_VCARD_JSON,
  HEADER_JSON
} = require('./constants');

module.exports = (dependencies, options = {}) => {
  const logger = dependencies('logger');

  const {
    ESNToken,
    user,
    davServerUrl,
    addressbookHome
  } = options;

  const { getDavEndpoint, checkResponse } = require('./utils')(dependencies, { davServerUrl });

  return (addressbookName = DEFAULT_ADDRESSBOOK_NAME) => {
    const vCardModule = require('./vCard')(dependencies, {
      ESNToken,
      addressbookHome,
      addressbookName,
      user
    });

    return {
      create,
      list,
      get,
      remove,
      update,
      vcard
    };

    /**
     * The vcard API
     *
     * @param cardId
     */
    function vcard(cardId) {
      return {
        ...vCardModule(cardId),
        removeMultiple: removeMultipleContacts
      };
    }

    /**
     * Create new addressbook
     * @param  {Object} addressbook The addressbook json to be created
     *
     * @return {Promise}
     */
    function create(addressbook) {
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };
      const method = 'POST';

      return _getParentUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            body: addressbook
          }, checkResponse(deferred, method, 'Error while creating addressbook in DAV'));

          return deferred.promise;
        });
    }

    /**
     * Remove an addressbook
     *
     * @return {Promise}
     */
    function remove() {
      const method = 'DELETE';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url
          }, checkResponse(deferred, method, 'Error while removing addressbook in DAV'));

          return deferred.promise;
        });
    }

    /**
     * Update an addressbook
     *
     * @return {Promise}
     */
    function update(modified) {
      const method = 'PROPPATCH';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            body: modified
          }, checkResponse(deferred, method, 'Error while updating addressbook in DAV'));

          return deferred.promise;
        });
    }

    /**
     * Get all addressbooks of current user
     * @param  {Object} options Options for listing address books
     *
     * @return {Promise}
     */
    function list(options = {}) {
      const method = 'GET';
      const headers = {
        ESNToken,
        accept: HEADER_VCARD_JSON
      };

      return _getParentUrl()
        .then(url => {
          const deferred = Q.defer();
          const clientOptions = {
            method,
            headers,
            url,
            json: true
          };

          if (options.query) { clientOptions.query = options.query; }

          davClient(clientOptions, checkResponse(deferred, method, 'Error while getting addressbook list in DAV'));

          return deferred.promise;
        });
    }

    /**
     * Get an addressbook
     * @return {Promise}
     */
    function get() {
      const method = 'PROPFIND';
      const headers = {
        ESNToken,
        accept: HEADER_JSON
      };

      const properties = {
        '{DAV:}displayname': 'dav:name',
        '{urn:ietf:params:xml:ns:carddav}addressbook-description': 'carddav:description',
        '{DAV:}acl': 'dav:acl',
        '{DAV:}invite': 'dav:invite',
        '{DAV:}share-access': 'dav:share-access',
        '{DAV:}group': 'dav:group',
        '{http://open-paas.org/contacts}subscription-type': 'openpaas:subscription-type',
        '{http://open-paas.org/contacts}source': 'openpaas:source',
        '{http://open-paas.org/contacts}type': 'type',
        '{http://open-paas.org/contacts}state': 'state',
        '{http://open-paas.org/contacts}numberOfContacts': 'numberOfContacts',
        acl: 'acl'
      };

      return _getUrl()
        .then(url => {
          const deferred = Q.defer();

          davClient({
            method,
            headers,
            url,
            json: true,
            body: {
              properties: Object.keys(properties)
            }
          }, (err, response, body) => {
            let newBody = body;

            if (!err && response.statusCode === 200) {
              newBody = {
                _links: {
                  self: { href: url }
                }
              };

              Object.keys(properties).forEach(key => {
                newBody[properties[key]] = body[key];
              });
            }

            checkResponse(deferred, method, 'Error while getting an addressbook from DAV')(err, response, newBody);
          });

          return deferred.promise;
        });
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
    function removeMultipleContacts(options = {}) {
      if (!options.hasOwnProperty('modifiedBefore')) {
        return Promise.reject(new Error('options.modifiedBefore is required'));
      }
      const query = {
        modifiedBefore: options.modifiedBefore
      };

      return vCardModule().list(query)
        .then(({ body }) => {
          if (!body || !body._embedded || !body._embedded['dav:item']) {
            return Promise.reject(new Error('Error while deleting multiple contacts'));
          }

          logger.debug('Removing %s contacts from DAV', body._embedded['dav:item'].length);

          return Promise.all(body._embedded['dav:item'].map(davItem => {
              const cardId = (new ICAL.Component(davItem.data)).getFirstPropertyValue('uid');

              return vCardModule(cardId).remove()
                .then(
                  data => ({ cardId: cardId, data: data }),
                  err => {
                    logger.error('Failed to delete contact', cardId, err);

                    return { cardId: cardId, error: err };
                  }
                );
              }));
        });
    }

    function _getUrl() {
      return getDavEndpoint(user)
        .then(davEndpoint => `${davEndpoint}/${ADDRESSBOOK_ROOT_PATH}/${addressbookHome}/${addressbookName}.json`);
    }

    function _getParentUrl() {
      return getDavEndpoint(user)
        .then(davEndpoint => `${davEndpoint}/${ADDRESSBOOK_ROOT_PATH}/${addressbookHome}.json`);
    }
  };
};
