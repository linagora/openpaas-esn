const Q = require('q');
const { SHARING_INVITE_STATUS } = require('../constants');
const { parseAddressbookPath } = require('../helper');

module.exports = function(dependencies, options = {}) {
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
    return _buildSearchingTargetAddressbooks(options)
      .then(addressbooks => Promise.all(addressbooks.map(({ bookHome, bookNames }) => _getSearchableAddressbooks(bookHome, bookNames))))
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
          excludeIds: options.excludeIds
        };

        return Q.ninvoke(searchClient, 'searchContacts', searchOptions).then(result => {
          const output = {
            total_count: result.total_count,
            current_page: result.current_page,
            results: []
          };

          if (!result.list || !result.list.length) {
            return output;
          }

          output.results = result.list.map(contact => {
            const contactObject = { ...contact._source };

            if (mappingSubscriptionsAndSources[`${contactObject.bookId}/${contactObject.bookName}`]) {
              contactObject['openpaas:addressbook'] = mappingSubscriptionsAndSources[`${contactObject.bookId}/${contactObject.bookName}`];
            }

            return contactObject;
          });

          return Promise.resolve(output);
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
