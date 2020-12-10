const Q = require('q');
const { SHARING_INVITE_STATUS } = require('../constants');
const { parseAddressbookPath, parseContactPath } = require('../helper');
const { ADDRESSBOOK_ROOT_PATH } = require('./constants');

let searchId = 0;

module.exports = function(dependencies, options = {}) {
  const logger = dependencies('logger');
  const searchClient = require('../search')(dependencies);
  const { getGroupAddressbookHomes } = require('./group-addressbook-home')(dependencies);
  const {
    ESNToken,
    davserver: davServerUrl,
    user
  } = options;

  const addressbookHome = require('./addressbookHome')(dependencies, {
    ESNToken,
    davServerUrl,
    user
  });

  return {
    addressbookHome,
    searchContacts
  };

  /**
   * Search contacts in the list specific address books
   * @param {Object} options Options object contains:
   *   + user: search contacts for the user
   *   + addressbooks: Array of target address books to search
   *    - specify list of target address books to search. Format: [{ bookHome: "123", bookNames: ["default"] }].
   *    - If bookNames is not given, will search in all address books of the corresponding bookHome
   *    - If there is no addressbooks, will search in the user book home and group address book homes which the user belongs to
   */
  function searchContacts(options = {}) {
    const internalSearchId = ++searchId;
    const startTime = Date.now();

    logger.debug(`CONTACT-SEARCH-${internalSearchId}`);

    return _buildSearchingTargetAddressbooks(options)
      .then(response => {
        logger.debug(`CONTACT-SEARCH-${internalSearchId}: _buildSearchingTargetAddressbooks ${Date.now() - startTime}ms`);

        return response;
      })
      .then(addressbooks => Promise.all(addressbooks.map(({ bookHome, bookNames }) => _getSearchableAddressbooks(bookHome, bookNames))))
      .then(response => {
        logger.debug(`CONTACT-SEARCH-${internalSearchId}: _getSearchableAddressbooks ${Date.now() - startTime}ms`);

        return response;
      })
      .then(results => [].concat.apply([], results))
      .then(searchableAddressbooks => {
        const addressbooksToSearch = [];
        const mappingSubscriptionsAndSources = {};

        searchableAddressbooks.forEach(addressbook => {
          const { bookHome, bookName } = parseAddressbookPath(addressbook._links.self.href);

          if (addressbook['openpaas:source']) {
            const parsedSourcePath = parseAddressbookPath(addressbook['openpaas:source']);

            mappingSubscriptionsAndSources[`${parsedSourcePath.bookHome}/${parsedSourcePath.bookName}`] = mappingSubscriptionsAndSources[`${parsedSourcePath.bookHome}/${parsedSourcePath.bookName}`] || {
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
          addressbooks: addressbooksToSearch,
          excludeIds: options.excludeIds,
          internalSearchId
        };

        return Q.ninvoke(searchClient, 'searchContacts', searchOptions)
        .then(response => {
          logger.debug(`CONTACT-SEARCH-${internalSearchId}: searchClient.searchContacts ${Date.now() - startTime}ms`);

          return response;
        })
        .then(result => {
          const output = {
            total_count: result.total_count,
            current_page: result.current_page,
            results: []
          };

          if (!result.list || !result.list.length) {
            return output;
          }

          const paths = result.list.map(contact => `/${ADDRESSBOOK_ROOT_PATH}/${contact._source.bookId}/${contact._source.bookName}/${contact._id}.vcf`);

          return addressbookHome().addressbook().getMultipleContactsFromPaths(paths)
            .then(contacts => contacts.map(({ vcard, path }, index) => {
              const { bookHome, bookName, contactId } = parseContactPath(path);

              output.results[index] = {
                bookId: bookHome,
                bookName,
                contactId,
                body: vcard
              };

              if (mappingSubscriptionsAndSources[`${bookHome}/${bookName}`]) {
                output.results[index]['openpaas:addressbook'] = mappingSubscriptionsAndSources[`${bookHome}/${bookName}`];
              }
            }))
            .then(response => {
              logger.debug(`CONTACT-SEARCH-${internalSearchId}: getMultipleContactsFromPaths ${Date.now() - startTime}ms`);

              return response;
            })
            .then(() => output);
        });
      });
  }

  /**
   * Build query address books
   * If there are address books, resolve with the given query address books
   * Otherwise, resolve with list of book homes: user book home and group book homes which the user belongs to
   */
  function _buildSearchingTargetAddressbooks({ user, addressbooks }) {
    if (Array.isArray(addressbooks) && addressbooks.length) {
      return Promise.resolve(addressbooks);
    }

    return getGroupAddressbookHomes(user, { davServerUrl, ESNToken })
      .then(groupAddressbookHomes => [{ bookHome: String(user._id) }].concat(groupAddressbookHomes.map(bookHome => ({ bookHome }))));
  }

  function _getSearchableAddressbooks(bookHome, bookNames) {
    return addressbookHome(bookHome)
      .addressbook()
      .list({
        query: {
          personal: true,
          subscribed: true,
          shared: true,
          inviteStatus: SHARING_INVITE_STATUS.ACCEPTED
        }
      }).then(data => {
        let addressbooks = data.body._embedded['dav:addressbook'];

        if (bookNames && bookNames.length) {
          addressbooks = _filterAddressbooksForSearch(addressbooks, bookNames);
        }

        return addressbooks;
      });
  }

  function _filterAddressbooksForSearch(addressbooks, bookNames) {
    return addressbooks.map(addressbook => {
      const bookName = parseAddressbookPath(addressbook._links.self.href).bookName;

      if (bookNames.indexOf(bookName) !== -1) {
        return addressbook;
      }
    }).filter(Boolean);
  }
};
