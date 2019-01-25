const Q = require('q');
const davClient = require('../dav-client').rawClient;
const { parseAddressbookPath } = require('../helper');

const TECHNICAL_USER_TYPE = 'dav';
const TOKEN_TTL = 20000;

module.exports = dependencies => {
  const coreTechnicalUser = dependencies('technical-user');
  const coreDomain = dependencies('domain');
  const davServerUtils = dependencies('davserver').utils;
  const listener = require('./listener')(dependencies);

  return {
    buildReindexOptions
  };

  function buildReindexOptions() {
    const options = listener.getOptions();

    options.name = 'contacts.idx';

    return _listContactsByCursor()
      .then(cursor => {
        options.next = cursor.next;

        return options;
      });
  }

  function _listContactsByCursor() {
    return _getDavEndpoint().then(davEndpoint =>
      _getAllAddressbooksInSystem(davEndpoint)
        .then(addressbooks => {
          addressbooks = addressbooks.filter(Boolean);
          let i = 0;

          return {
            next
          };

          function next() {
            if (!addressbooks[i]) return;

            const { domainId, addressbookPath } = addressbooks[i];

            i++;

            return _getTechnicalToken(domainId)
              .then(token =>
                _davRequest({
                  headers: { ESNToken: token },
                  url: `${davEndpoint}${addressbookPath}`,
                  json: true
                }).then(data => {
                  const { bookHome, bookName } = parseAddressbookPath(data._links.self.href);

                  if (data._embedded['dav:item'].length === 0) return next();

                  return data._embedded['dav:item'].map(davItem => {
                    const contactId = davItem._links.self.href.split('/').pop().replace('.vcf', '');

                    return {
                      id: contactId,
                      contactId,
                      bookId: bookHome,
                      user: { _id: bookHome },
                      bookName,
                      vcard: davItem.data
                    };
                  });
                })
              );
          }
        })
    );
  }

  function _getDavEndpoint() {
    return new Promise(resolve => davServerUtils.getDavEndpoint(davEndpoint => resolve(davEndpoint)));
  }

  function _getAllAddressbooksInSystem(davEndpoint) {
    return Q.ninvoke(coreDomain, 'list', {})
      .then(domains => {
        const promises = domains.map(domain => _getAddressbooksFromAllBookHomesInDomain(domain._id, davEndpoint));

        return Promise.all(promises)
          .then(values => {
            let addressbooks = [];

            values.forEach(value => {
              addressbooks = addressbooks.concat(value);
            });

            return addressbooks;
          });
      });
  }

  function _getAddressbooksFromAllBookHomesInDomain(domainId, davEndpoint) {
    return _getTechnicalToken(domainId)
      .then(token => {
        if (!token) return [];

        return _davRequest({
          headers: { ESNToken: token },
          url: `${davEndpoint}/addressbooks`,
          json: true
        }).then(bookHomes => {
          const promises = bookHomes.map(bookHome => _getAddressbookPathsFromBookHome(bookHome, { token, davEndpoint }));

          return Promise.all(promises)
            .then(values => {
              let addressbookPaths = [];

              values.forEach(value => {
                addressbookPaths = addressbookPaths.concat(value);
              });

              addressbookPaths = [...new Set(addressbookPaths)]; //remove duplicate address books. For example: domain address book

              return addressbookPaths.map(addressbookPath => ({ domainId, addressbookPath }));
            });
        });
      });
  }

  function _getAddressbookPathsFromBookHome(bookHome, options) {
    return _davRequest({
      headers: { ESNToken: options.token },
      url: `${options.davEndpoint}/addressbooks/${bookHome}.json?personal=true`,
      json: true
    }).then(data => {
      const addressbookPaths = [];

      data._embedded['dav:addressbook'].forEach(addressbook => {
        addressbookPaths.push(addressbook._links.self.href);
      });

      return addressbookPaths;
    });
  }

  function _davRequest(options) {
    return new Promise((resolve, reject) => {
      davClient(options, (err, response, body) => {
        if (err) {
          return reject(err);
        }

        if (response.statusCode !== 200) {
          return reject({ response, body });
        }

        return resolve(body);
      });
    });
  }

  function _getTechnicalToken(domainId) {
    return Q.ninvoke(coreTechnicalUser, 'findByTypeAndDomain', TECHNICAL_USER_TYPE, domainId)
      .then(technicalUsers => {
        if (!technicalUsers || !technicalUsers.length) {
          return;
        }

        return Q.ninvoke(coreTechnicalUser, 'getNewToken', technicalUsers[0], TOKEN_TTL)
          .then(data => {
            if (!data) {
              Promise.reject(new Error('Can not generate token for contact reindex'));
            }

            return data.token;
          });
      });
  }
};
