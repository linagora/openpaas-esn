module.exports = dependencies => {
  const coreUserModule = dependencies('user');
  const esnConfig = dependencies('esn-config');
  const logger = dependencies('logger');
  const client = require('../client')(dependencies);
  const { toVCard } = require('./mapping')(dependencies);
  const {
    getTechnicalUser,
    getTechnicalToken
  } = require('./utils')(dependencies);

  const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('./contants');

  return synchronize;

  function synchronize(domainId) {
    const syncTime = Date.now();

    return Promise.all([
      _getTechnicalUserAndToken(domainId),
      _getESNBaseURL(domainId)
    ]).then(results => {
      const { technicalUser, technicalToken } = results[0];
      const esnBaseUrl = results[1];
      const cursor = coreUserModule.listByCursor({
        domainIds: [domainId],
        canLogin: true,
        isSearchable: true
      });

      logger.debug(`Synchronizing domain members address book for domain ${domainId}`);

      return _createContacts({
        cursor,
        counter: 0,
        domainId,
        esnBaseUrl,
        technicalUser,
        technicalToken
      })
      .then(counter => logger.info(`Created ${counter} contacts in domain members address book for domain ${domainId}`))
      .then(() => _cleanOutdatedContacts({
        domainId,
        technicalUser,
        technicalToken,
        syncTime
      }))
      .then(counter => logger.info(`Cleaned ${counter} outdated contacts in domain members address book for domain ${domainId}`));
    });
  }

  function _getTechnicalUserAndToken(domainId) {
    return getTechnicalUser(domainId).then(technicalUser => {
      if (!technicalUser) {
        return Promise.reject(new Error(`Unable to find a technical user for domain ${domainId}`));
      }

      return getTechnicalToken(technicalUser).then(technicalToken => (
        { technicalUser, technicalToken }
      ));
    });
  }

  function _getESNBaseURL(domainId) {
    const config = esnConfig('web').inModule('core');

    config.esnConfig.setDomainId(domainId);

    return config.get()
      .then(webConfig => webConfig && webConfig.base_url);
  }

  function _createContacts({ cursor, counter, domainId, esnBaseUrl, technicalUser, technicalToken }) {
    return cursor.next()
      .then(user => {
        if (!user) return counter;

        const vCard = toVCard(user, esnBaseUrl);
        const contactId = vCard.getFirstPropertyValue('uid');

        counter++;

        return client({
          ESNToken: technicalToken,
          user: technicalUser
        })
          .addressbookHome(domainId)
          .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
          .vcard(contactId)
          .create(vCard.toJSON())
          .then(() => _createContacts({
            cursor,
            counter,
            domainId,
            esnBaseUrl,
            technicalUser,
            technicalToken
          }));
        });
  }

  function _cleanOutdatedContacts({ domainId, technicalUser, technicalToken, syncTime }) {
    return client({
      ESNToken: technicalToken,
      user: technicalUser
    })
    .addressbookHome(domainId)
    .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
    .vcard()
    .removeMultiple({
      modifiedBefore: syncTime / 1000
    })
    .then(ids => ids.length);
  }
};
