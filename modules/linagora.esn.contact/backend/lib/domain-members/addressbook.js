module.exports = dependencies => {
  const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('./contants');
  const logger = dependencies('logger');
  const contactClient = require('../client')(dependencies);
  const { getTechnicalUser, getTechnicalToken } = require('./utils')(dependencies);

  return {
    createDomainMembersAddressbook,
    getDomainMembersAddressbook,
    getClientOptionsForDomain,
    removeDomainMembersAddressbook
  };

  function createDomainMembersAddressbook(domainId, options) {
    const addressbook = {
      id: DOMAIN_MEMBERS_ADDRESS_BOOK_NAME,
      'dav:name': 'Domain members',
      'carddav:description': 'Address book contains all domain members',
      'dav:acl': ['{DAV:}read'],
      type: 'group'
    };

    return contactClient(options)
      .addressbookHome(domainId)
      .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
      .create(addressbook)
      .catch(err => {
        logger.error(`Error while creating domain members addressbook of domain ${domainId}`, err);

        return Promise.reject(err);
      });
  }

  function removeDomainMembersAddressbook(domainId, options) {
    return contactClient(options)
      .addressbookHome(domainId)
      .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
      .remove()
      .catch(err => {
        logger.error(`Error while removing domain members addressbook of domain ${domainId}`, err);

        return Promise.reject(err);
      });
  }

  function getDomainMembersAddressbook(domainId, options) {
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

  function getClientOptionsForDomain(domainId) {
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
