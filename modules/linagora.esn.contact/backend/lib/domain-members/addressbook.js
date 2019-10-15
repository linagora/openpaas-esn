module.exports = dependencies => {
  const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('./contants');
  const logger = dependencies('logger');
  const contactClient = require('../client')(dependencies);
  const { getTechnicalUser, getTechnicalToken } = require('./utils')(dependencies);

  return {
    createDomainMembersAddressbook,
    removeDomainMembersAddressbook
  };

  function createDomainMembersAddressbook(domainId) {
    return getClientOptions(domainId)
      .then(options => _getDomainMembersAddressbook(domainId, options)
          .then(domainMembersAddressbook => {
            if (domainMembersAddressbook) return Promise.resolve();

            const addressbook = {
              id: DOMAIN_MEMBERS_ADDRESS_BOOK_NAME,
              'dav:name': 'Domain members',
              'carddav:description': 'Address book of all domain members',
              'dav:acl': ['{DAV:}read'],
              type: 'group'
            };

            return contactClient(options)
              .addressbookHome(domainId)
              .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
              .create(addressbook)
              .catch(err => logger.error(`Error while creating domain members addressbook of domain ${domainId}`, err));
          }));
  }

  function removeDomainMembersAddressbook(domainId) {
    return getClientOptions(domainId)
      .then(options => _getDomainMembersAddressbook(domainId, options)
        .then(domainMembersAddressbook => {
          if (!domainMembersAddressbook) return Promise.resolve();

          return contactClient(options)
            .addressbookHome(domainId)
            .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
            .remove()
            .catch(err => logger.error(`Error while removing domain members addressbook of domain ${domainId}`, err));
      }));
  }

  function _getDomainMembersAddressbook(domainId, options) {
    return contactClient(options)
      .addressbookHome(domainId)
      .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
      .get()
      .catch(err => {
        if (err.statusCode === 404) return Promise.resolve();

        logger.error(`Error while getting domain members addressbook of domain ${domainId}`, err);

        return Promise.reject(err);
      });
  }

  function getClientOptions(domainId) {
    const options = {};

    return getTechnicalUser(domainId)
      .then(technicalUser => {
        options.user = technicalUser;

        return getTechnicalToken(technicalUser)
          .then(token => {
            options.ESNToken = token;

            return Promise.resolve(options);
          });
      });
  }
};
