(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactAPIClient', ContactAPIClient);

  function ContactAPIClient(
    $q,
    uuid4,
    AddressbookShell,
    ContactShell,
    ContactShellBuilder,
    contactAvatarService,
    VcardBuilder,
    davClient,
    CONTACT_ACCEPT_HEADER,
    CONTACT_CONTENT_TYPE_HEADER,
    CONTACT_LIST_PAGE_SIZE,
    CONTACT_LIST_DEFAULT_SORT,
    CONTACT_PREFER_HEADER,
    DEFAULT_ADDRESSBOOK_NAME,
    GRACE_DELAY,
    ICAL
  ) {
    var ADDRESSBOOK_PATH = '/addressbooks';

    return { addressbookHome: addressbookHome };

    /**
     * The addressbook API
     * Examples:
     * - List addressbooks: addressbookHome(bookId).addressbook().list()
     * - Get an addressbook: addressbookHome(bookId).addressbook(bookName).get()
     * - Create an addressbook: addressbookHome(bookId).addressbook().create(addressbook)
     * - Remove an addressbook: addressbookHome(bookId).addressbook(bookName).remove()
     * - Update an addressbook: addressbookHome(bookId).addressbook(bookName).update(addressbook)
     * - Update members rights for a group address book: addressbookHome(bookId).addressbook(bookName).updateMembersRight(membersRight)
     * - List contacts: addressbookHome(bookId).addressbook(bookName).vcard().list(options)
     * - Search contacts: addressbookHome(bookId).addressbook(bookName).vcard().search(options)
     * - Get a contact: addressbookHome(bookId).addressbook(bookName).vcard(cardId).get()
     * - Create a contact: addressbookHome(bookId).addressbook(bookName).vcard().create(contact)
     * - Update a contact: addressbookHome(bookId).addressbook(bookName).vcard(cardId).update(contact)
     * - Remove a contact: addressbookHome(bookId).addressbook(bookName).vcard(cardId).remove(options)
     * - Move a contact: addressbookHome(bookId).addressbook(bookName).vcard(cardId).move(options)
     * @param  {String} bookId the addressbook home ID
     * @return {addressbook: function, search: function}
     */
    function addressbookHome(bookId) {
      function addressbook(bookName) {
        bookName = bookName || DEFAULT_ADDRESSBOOK_NAME;

        return {
          acceptShare: acceptShare,
          create: create,
          declineShare: declineShare,
          list: list,
          get: get,
          remove: remove,
          share: share,
          update: update,
          updateMembersRight: updateMembersRight,
          updatePublicRight: updatePublicRight,
          vcard: vcard
        };

        function create(addressbook) {
          return createAddressbook(bookId, addressbook);
        }

        function list(query) {
          return listAddressbook(bookId, query);
        }

        function get() {
          return getAddressbook(bookId, bookName);
        }

        function remove() {
          return removeAddressbook(bookId, bookName);
        }

        function update(addressbook) {
          return updateAddressbook(bookId, bookName, addressbook);
        }

        function share(sharees) {
          return shareAddressbook(bookId, bookName, sharees);
        }

        function acceptShare(options) {
          return replyInvitation(bookId, bookName, true, options);
        }

        function declineShare(options) {
          return replyInvitation(bookId, bookName, false, options);
        }

        function updatePublicRight(publicRight) {
          return setPublicRight(bookId, bookName, publicRight);
        }

        function updateMembersRight(membersRight) {
          return setMembersRight(bookId, bookName, membersRight);
        }

        function vcard(cardId) {
          function get() {
            return getCard(bookId, bookName, cardId);
          }

          function list(options) {
            return listCard(bookId, bookName, options);
          }

          function search(options) {
            options.bookId = bookId;
            options.bookName = bookName;

            return searchCard(options);
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

          function move(options) {
            return moveCard(bookId, bookName, cardId, options);
          }

          return {
            get: get,
            list: list,
            move: move,
            search: search,
            create: create,
            update: update,
            remove: remove
          };
        }
      }

      function search(options) {
        options.bookId = bookId;

        return searchCard(options);
      }

      return {
        addressbook: addressbook,
        search: search
      };
    }

    /**
     * Return the AddressbookHome URL, each user has one AddressbookHome
     * @param  {String} bookId The AddressbookHome ID
     * @return {String}
     */
    function getBookHomeUrl(bookId) {
      return [ADDRESSBOOK_PATH, bookId + '.json'].join('/');
    }

    /**
     * Return the AddressBook url, each user can have many AddressBooks
     * @param  {String} bookId   The AddressbookHome ID
     * @param  {String} bookName The addressbook name, AKA uri field of the addressbook
     * @return {String}
     */
    function getBookUrl(bookId, bookName) {
      return [ADDRESSBOOK_PATH, bookId, bookName + '.json'].join('/');
    }

    /**
     * Return the VCard url
     * @param  {String} bookId   The AddressbookHome ID
     * @param  {String} bookName The addressbook name
     * @param  {String} cardId   The card ID
     * @return {String}
     */
    function getVCardUrl(bookId, bookName, cardId) {
      return [ADDRESSBOOK_PATH, bookId, bookName, cardId + '.vcf'].join('/');
    }

    /**
     * List all addressbooks of a user
     * @param  {String} bookId The AddressbookHome ID
     * @param  {Object} query Optional, the query for listing address books
     * @return {Promise}        Resolve an array of AddressbookShell if success
     */
    function listAddressbook(bookId, query) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('GET', getBookHomeUrl(bookId), headers, null, query)
        .then(function(response) {
          if (response.data._embedded && response.data._embedded['dav:addressbook']) {
            return response.data._embedded['dav:addressbook'].map(function(item) {
              return new AddressbookShell(item);
            });
          }
        });
    }

    /**
     * Get a specified addressbook
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @return {Promise}          Resolve AddressbookShell if success
     */
    function getAddressbook(bookId, bookName) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('PROPFIND', getBookUrl(bookId, bookName), headers)
        .then(function(response) {
          return new AddressbookShell(response.data);
        });
    }

    /**
     * Create a addressbook in the specified addressbook home
     * @param  {String} bookId      The addressbook home ID
     * @param  {Object} addressbook The addressbook object to create
     *                              It must contain name and type, and it may contain description
     *                              If no addressbook.id is specified, the ID will be generated by uuid4
     * @return {Promise}            Resolve AddressbookShell if success
     */
    function createAddressbook(bookId, addressbook) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      if (!addressbook.id) {
        addressbook.id = uuid4.generate();
      }

      return davClient('POST', getBookHomeUrl(bookId), headers, addressbook)
        .then(function() {
          return davClient('PROPFIND', getBookUrl(bookId, addressbook.id), headers)
            .then(function(response) {
              return new AddressbookShell(response.data);
            });
        });
    }

    /**
     * Remove an addressbook in the specified addressbook home
     * @param  {String} bookId   The addressbook home ID
     * @param  {String} bookName The addressbook name
     * @return {Promise}         Resolve on success
     */
    function removeAddressbook(bookId, bookName) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('DELETE', getBookUrl(bookId, bookName), headers);
    }

    /**
     * Update an addressbook in the specified addressbook home
     * @param  {String} bookId     The addressbook home ID
     * @param  {String} bookName   The addressbook name
     * @param  {Object} addressbook The addressbook object to update. It may contain name, description, state.
     * @return {Promise}           Resolve on success
     */
    function updateAddressbook(bookId, bookName, addressbook) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      return davClient('PUT', getBookUrl(bookId, bookName), headers, addressbook);
    }

    /**
     * Share an addressbook
     * @param  {String} bookId     The addressbook home ID
     * @param  {String} bookName   The addressbook name
     * @param  {Object} addressbook The addressbook object to update. It may contain name, description.
     * @return {Promise}           Resolve on success
     */
    function shareAddressbook(bookId, bookName, sharees) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };
      var data = {
        'dav:share-resource': {
        'dav:sharee': sharees.map(function(sharee) {
            return {
              'dav:href': sharee.href,
              'dav:share-access': sharee.access
            };
          })
        }
      };

      return davClient('POST', getBookUrl(bookId, bookName), headers, data);
    }

    function replyInvitation(bookId, bookName, accepted, options) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };
      var data = {
        'dav:invite-reply': {
          'dav:invite-accepted': accepted
        }
      };

      if (options.displayname) {
        data['dav:invite-reply']['dav:slug'] = options.displayname;
      }

      return davClient('POST', getBookUrl(bookId, bookName), headers, data);
    }

   /**
    * Update addressbook public right
    * @param {String} bookId      The addressbook home ID
    * @param {String} bookName    The addressbook name
    * @param {String} publicRight The new public right to update, null for
    * unpublish address book
    */
    function setPublicRight(bookId, bookName, publicRight) {
      var headers = { 'Content-Type': CONTACT_CONTENT_TYPE_HEADER };
      var data;

      if (!publicRight) {
        data = { 'dav:unpublish-addressbook': true };
      } else {
        data = {
          'dav:publish-addressbook': {
            privilege: publicRight
          }
        };
      }

      return davClient('POST', getBookUrl(bookId, bookName), headers, data);
    }

    /**
    * Update members right for a group address book
    * @param {String} bookId      The address book home ID
    * @param {String} bookName    The address book name
    * @param {Array}  membersRight The new members right to update
    */
   function setMembersRight(bookId, bookName, membersRight) {
    var headers = { 'Content-Type': CONTACT_CONTENT_TYPE_HEADER };
    var data = {
      'dav:group-addressbook': {
        privileges: membersRight
      }
    };

    return davClient('POST', getBookUrl(bookId, bookName), headers, data);
  }

    /**
     * Get specified card
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @param  {String} cardId   the card ID to get
     * @return {Promise}          Resolve ContactShell if success
     */
    function getCard(bookId, bookName, cardId) {
      var headers = { Accept: CONTACT_ACCEPT_HEADER };

      var href = getVCardUrl(bookId, bookName, cardId);

      return davClient('GET', href, headers)
        .then(function(response) {
          var contact = new ContactShell(
            new ICAL.Component(response.data), response.headers('ETag'));

          contactAvatarService.forceReloadDefaultAvatar(contact);

          return contact;
        });
    }

    /**
     * List cards from an addressbook
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @param  {Object} options  Optional, includes:
     *                             + page(Number): current page
     *                             + limit(Number):
     *                             + paginate(Boolean):
     *                             + sort(String):
     *                             + userId(String):
     * @return {Promise}          If success, resolve an object with:
     *                            + data: an array of ContactShell
     *                            + current_page:
     *                            + last_page: true or false
     */
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
          return ContactShellBuilder.fromCardListResponse(response).then(function(shells) {

            shells.forEach(function(contact) {
              contact.objectType = 'contact';
            });

            var result = {
              data: shells,
              current_page: currentPage,
              last_page: !response.data._links.next
            };

            if (!response.last_page) {
              result.next_page = currentPage + 1;
            }

            return result;
          });
        });
    }

    /**
     * Search card
     * @param  {Object} options  Search options, includes:
     *                            + bookId: The AB home ID
     *                            + bookName: The AB name
     *                             + data: query to search
     *                            + userId
     *                            + page
     * @return {Promise}          If success, return an object with:
     *                            + current_page
     *                            + total_hits
     *                            + data: an array of ContactShell
     */
    function searchCard(options) {
      if (!options) {
        return $q.reject('Missing options');
      }

      var params = {
        search: options.data,
        page: options.page,
        limit: options.limit || CONTACT_LIST_PAGE_SIZE
      };

      return davClient(
        'GET',
        getBookHomeUrl(options.bookId) + '/contacts',
        null,
        null,
        params
      ).then(function(response) {
        return ContactShellBuilder.fromCardSearchResponse(response).then(function(shells) {
          var result = {
            current_page: response.data._current_page,
            total_hits: response.data._total_hits,
            data: shells,
            last_page: !response.data._links.next
          };

          if (!result.last_page) {
            result.next_page = parseInt(result.current_page, 10) + 1;
          }

          return result;
        });
      });
    }

    /**
     * Create a vcard
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @param  {ContactShell} contact  Contact to be created, if no contact.id
     *                                 is specified, the ID will be generated by
     *                                 uuid4
     * @return {Promise}          Result if success with statusCode 201
     */
    function createCard(bookId, bookName, contact) {
      var headers = { 'Content-Type': CONTACT_CONTENT_TYPE_HEADER };

      if (!contact.id) {
        contact.id = uuid4.generate();
      }

      return davClient(
          'PUT',
          getVCardUrl(bookId, bookName, contact.id),
          headers,
          VcardBuilder.toJSON(contact)
        ).then(function(response) {
          if (response.status !== 201) {
            return $q.reject(response);
          }
          return response;
        });
    }

    /**
     * Move a vcard
     * @param  {String} bookId   The addressbook home ID
     * @param  {String} bookName The addressbook name
     * @param  {String} cardId   The card ID to move
     * @param  {Object} options  Includes "destAddressbook" which is destination addressbook name to move contact to
     * @return {Promise}         Resolve on success
     */
    function moveCard(bookId, bookName, cardId, options) {
      var headers = {
        Destination: getVCardUrl(options.toBookId, options.toBookName, cardId)
      };

      return davClient(
        'MOVE',
        getVCardUrl(bookId, bookName, cardId),
        headers
      );
    }

    /**
     * Update a card
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @param  {String} cardId   the card ID to update
     * @param  {ContactShell} contact  the contact to be updated
     * @return {Promise}          Resolve grace period taskId if success
     */
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
          VcardBuilder.toJSON(contact),
          params
        ).then(function(response) {
          if (response.status === 202 || response.status === 204) {
            return response.headers('X-ESN-TASK-ID');
          } else {
            return $q.reject(response);
          }
        });
    }

    /**
     * Remove a card
     * @param  {String} bookId   the addressbook home ID
     * @param  {String} bookName the addressbook name
     * @param  {String} cardId   the card ID to update
     * @param  {Object} options  Includes:
     *                               + etag
     *                               + graceperiod
     * @return {Promise}          If success and it's a grace task: resolve
     *                               grace period taskId
     *                            If success and it's not a grace task: resolve
     *                              nothing
     */
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
  }
})(angular);
