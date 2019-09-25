module.exports = dependencies => {
  const coreUserModule = dependencies('user');
  const esnConfig = dependencies('esn-config');

  const logger = dependencies('logger');
  const { toVCard } = require('./mapping')(dependencies);
  const client = require('../client')(dependencies);
  const {
    getTechnicalUser,
    getTechnicalToken
  } = require('./utils')(dependencies);

  const { DOMAIN_MEMBERS_ADDRESS_BOOK_NAME } = require('./contants');

  return synchronize;

  function synchronize(domainId) {
    const syncTime = Date.now();

    return Promise.all([
      getTechnicalUser(domainId),
      _getESNBaseURL(domainId)
    ]).then(results => {
      const technicalUser = results[0];
      const esnBaseUrl = results[1];

      if (!technicalUser) {
        return Promise.reject(new Error(`Cannot synchronize domain members address book for domain ${domainId} since there is no technical user`));
      }

      return getTechnicalToken(technicalUser)
        .then(technicalToken => {
          const cursor = coreUserModule.listByCursor({
            domainIds: [domainId],
            canLogin: true,
            isSearchable: true
          });
          let counter = 0;

          logger.debug(`Synchronizing domain members address book for domain ${domainId}`);

          function exec(domainId) {
            return cursor.next()
              .then(user => {
                if (!user) {
                  return;
                }

                counter++;

                const vCard = toVCard(user, esnBaseUrl);
                const contactId = vCard.getFirstPropertyValue('uid');

                return client({
                  ESNToken: technicalToken,
                  user: technicalUser
                })
                  .addressbookHome(domainId)
                  .addressbook(DOMAIN_MEMBERS_ADDRESS_BOOK_NAME)
                  .vcard(contactId)
                  .create(vCard.toJSON())
                  .then(() => exec(domainId, esnBaseUrl));
                });
          }

          return exec(domainId)
            .then(() => _cleanOutdatedContacts({
              technicalUser,
              technicalToken,
              domainId,
              syncTime
            }))
            .then(() => logger.debug(`Synchronized ${counter} members for domain ${domainId} to domain address book`));
        });
    });
  }

  function _getESNBaseURL(domainId) {
    const config = esnConfig('web').inModule('core');

    config.esnConfig.setDomainId(domainId);

    return config.get()
      .then(webConfig => webConfig && webConfig.base_url);
  }

  function _cleanOutdatedContacts(options) {
    const {
      technicalUser,
      technicalToken,
      syncTime,
      domainId
    } = options;

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
    .then(ids => {
      logger.info(`Cleaned %d outdated contacts in domain members address book for domain ${domainId}`, ids.length);

      return;
    }, err => {
      logger.error(`Cannot clean outdated contacts in domain address book for domain ${domainId} due to error:`, err);

      return Promise.reject(err);
    });
  }
};
