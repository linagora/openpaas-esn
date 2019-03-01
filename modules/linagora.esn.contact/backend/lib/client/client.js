const Q = require('q');
const { SHARING_INVITE_STATUS } = require('../constants');
const { parseAddressbookPath, parseContactPath } = require('../helper');
const { ADDRESSBOOK_ROOT_PATH } = require('./constants');

module.exports = function(dependencies, options = {}) {
  const searchClient = require('../search')(dependencies);
  const {
    ESNToken,
    davserver,
    user
  } = options;

  const addressbookHomeModule = require('./addressbookHome')(dependencies, {
    ESNToken,
    davServerUrl: davserver,
    user
  });

  return {
    addressbookHome
  };

  function addressbookHome(bookHome) {
    return {
      ...addressbookHomeModule(bookHome),
      search: options => _searchContacts(bookHome, options)
    };
  }

  /**
   * Search contacts in all the addressbooks of the address book home
   */
  function _searchContacts(bookHome, options) {
      return addressbookHomeModule(bookHome)
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

          if (options.bookNames && options.bookNames.length) {
            addressbooks = _filterAddressbooksForSearch(addressbooks, options.bookNames);
          }

          const addressbooksToSearch = [];
          const mapping = {}; // To mapping between subscription address books and their sources

          addressbooks.forEach(addressbook => {
            const { bookHome, bookName } = parseAddressbookPath(addressbook._links.self.href);

            if (addressbook['openpaas:source']) {
              const parsedSourcePath = parseAddressbookPath(addressbook['openpaas:source']);

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
            addressbooks: addressbooksToSearch,
            excludeIds: options.excludeIds
          };

          return Q.ninvoke(searchClient, 'searchContacts', searchOptions).then(result => {
            const output = {
              total_count: result.total_count,
              current_page: result.current_page,
              results: []
            };

            if (!result.list || result.list.length === 0) {
              return output;
            }

            const paths = result.list.map(contact => `/${ADDRESSBOOK_ROOT_PATH}/${contact._source.bookId}/${contact._source.bookName}/${contact._id}.vcf`);

            return addressbookHomeModule().addressbook().getMultipleContactsFromPaths(paths)
              .then(contacts => contacts.map(({ vcard, path }, index) => {
                const { bookHome, bookName, contactId } = parseContactPath(path);

                output.results[index] = {
                  bookId: bookHome,
                  bookName,
                  contactId,
                  body: vcard
                };

                if (mapping[`${bookHome}/${bookName}`]) {
                  output.results[index]['openpaas:addressbook'] = mapping[`${bookHome}/${bookName}`];
                }
              }))
              .then(() => output);
        });
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
