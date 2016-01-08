'use strict';

angular.module('linagora.esn.contact')
  .constant('CONTACT_ACCEPT_HEADER', 'application/vcard+json')
  .constant('CONTACT_CONTENT_TYPE_HEADER', 'application/vcard+json')
  .constant('CONTACT_PREFER_HEADER', 'return=representation')
  .factory('ContactAPIClient', function($q,
                            uuid4,
                            ContactShell,
                            AddressbookShell,
                            ContactsHelper,
                            ICAL,
                            CONTACT_ACCEPT_HEADER,
                            CONTACT_CONTENT_TYPE_HEADER,
                            CONTACT_PREFER_HEADER,
                            DEFAULT_ADDRESSBOOK_NAME,
                            GRACE_DELAY,
                            CONTACT_LIST_PAGE_SIZE,
                            CONTACT_LIST_DEFAULT_SORT,
                            shellToVCARD,
                            davClient,
                            contactUpdateDataService) {
    var ADDRESSBOOK_PATH = '/addressbooks';

    function responseAsContactShell(response) {
      if (response.data && response.data._embedded && response.data._embedded['dav:item']) {
        return response.data._embedded['dav:item'].map(function(vcarddata) {
          var contact =  new ContactShell(new ICAL.Component(vcarddata.data));
          if (contactUpdateDataService.contactUpdatedIds.indexOf(contact.id) > -1) {
            ContactsHelper.forceReloadDefaultAvatar(contact);
          }
          return contact;
        });
      }
      return [];
    }

    function getBookHomeUrl(bookId) {
      return [ADDRESSBOOK_PATH, bookId + '.json'].join('/');
    }

    function getBookUrl(bookId, bookName) {
      return [ADDRESSBOOK_PATH, bookId, bookName + '.json'].join('/');
    }

    function getVCardUrl(bookId, bookName, cardId) {
      return [ADDRESSBOOK_PATH, bookId, bookName, cardId + '.vcf'].join('/');
    }

    // ======================== AB function ====================================

    function listAddressbook(bookId) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('GET', getBookHomeUrl(bookId), headers)
        .then(function(response) {
          if (response.data._embedded && response.data._embedded['dav:addressbook']) {
            return response.data._embedded['dav:addressbook'].map(function(item) {
              return new AddressbookShell(item);
            });
          }
        });
    }

    // ====================== VCARD functions ==================================

    function getCard(bookId, bookName, cardId) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('GET', getVCardUrl(bookId, bookName, cardId), headers)
        .then(function(response) {
          var contact = new ContactShell(
            new ICAL.Component(response.data), response.headers('ETag'));
          ContactsHelper.forceReloadDefaultAvatar(contact);
          return contact;
        });
    }

    function listCard(bookId, bookName, options) {
      options = options || {};
      var currentPage = options.page || 1;
      var limit = options.limit || CONTACT_LIST_PAGE_SIZE;
      var offset = (currentPage - 1) * limit;

      var query = {
        sort: options.sort || CONTACT_LIST_DEFAULT_SORT,
        userId: options.userId
      };

      if (options.paginate) {
        query.limit = limit;
        query.offset = offset;
      }

      return davClient('GET', getBookUrl(bookId, bookName), null, null, query)
        .then(function(response) {
          var result = {
            contacts: responseAsContactShell(response),
            current_page: currentPage,
            last_page: !response.data._links.next
          };
          if (!response.last_page) {
            result.next_page = currentPage + 1;
          }
          return result;
        });
    }

    function searchCard(bookId, bookName, options) {
      if (!options) {
        return $q.reject('Missing options');
      }
      var params = {
        search: options.data,
        userId: options.userId,
        page: options.page
      };
      return davClient(
          'GET',
          getBookUrl(bookId, bookName),
          null,
          null,
          params
        ).then(function(response) {
          return {
            current_page: response.data._current_page,
            total_hits: response.data._total_hits,
            hits_list: responseAsContactShell(response)
          };
        });
    }

    function createCard(bookId, bookName, contact) {
      var headers = { 'Content-Type': CONTACT_CONTENT_TYPE_HEADER };

      if (!contact.id) {
        contact.id = uuid4.generate();
      }

      return davClient(
          'PUT',
          getVCardUrl(bookId, bookName, contact.id),
          headers,
          shellToVCARD(contact).toJSON()
        ).then(function(response) {
          if (response.status !== 201) {
            return $q.reject(response);
          }
          return response;
        });
    }

    function updateCard(bookId, bookName, cardId, contact) {
      if (!cardId) {
        return $q.reject(new Error('Missing cardId'));
      }

      var headers = {
        'Content-Type': CONTACT_CONTENT_TYPE_HEADER,
        Prefer: CONTACT_PREFER_HEADER
      };

      if (contact.etag) {
        headers['If-Match'] = contact.etag;
      }

      var params = { graceperiod: GRACE_DELAY };

      return davClient('PUT',
          getVCardUrl(bookId, bookName, cardId),
          headers,
          shellToVCARD(contact).toJSON(),
          params
        ).then(function(response) {
          if (response.status === 202 || response.status === 204) {
            return response.headers('X-ESN-TASK-ID');
          } else {
            return $q.reject(response);
          }
        });
    }

    function removeCard(bookId, bookName, cardId, options) {
      if (!cardId) {
        return $q.reject(new Error('Missing cardId'));
      }

      options = options || {};
      var headers = {};
      if (options.etag) {
        headers['If-Match'] = options.etag;
      }

      var params = {};
      if (options.graceperiod) {
        params.graceperiod = options.graceperiod;
      }

      return davClient('DELETE',
          getVCardUrl(bookId, bookName, cardId),
          headers,
          null,
          params
        ).then(function(response) {
          if (response.status !== 204 && response.status !== 202) {
            return $q.reject(response);
          }

          return response.headers('X-ESN-TASK-ID');
        });
    }

    function addressbookHome(bookId) {
      function addressbook(bookName) {
        bookName = bookName || DEFAULT_ADDRESSBOOK_NAME;

        function list() {
          return listAddressbook(bookId);
        }

        function vcard(cardId) {
          function get() {
            return getCard(bookId, bookName, cardId);
          }

          function list(options) {
            return listCard(bookId, bookName, options);
          }

          function search(options) {
            return searchCard(bookId, bookName, options);
          }

          function create(contact) {
            return createCard(bookId, bookName, contact);
          }

          function update(contact) {
            return updateCard(bookId, bookName, cardId, contact);
          }

          function remove(options) {
            return removeCard(bookId, bookName, cardId, options);
          }

          return {
            get: get,
            list: list,
            search: search,
            create: create,
            update: update,
            remove: remove
          };
        }
        return {
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
  });
