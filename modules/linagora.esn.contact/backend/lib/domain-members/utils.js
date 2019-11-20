const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('./contants');

module.exports = dependencies => {
  const coreTechnicalUser = dependencies('technical-user');
  const { submitJob } = dependencies('jobqueue').lib;
  const { EsnConfig } = dependencies('esn-config');

  const TECHNICAL_USER_TYPE = 'dav';
  const TOKEN_TTL = 20000;

  return {
    isFeatureEnabled,
    getTechnicalUser,
    getTechnicalToken,
    submitSynchronizationJob,
    submitSynchronizationJobForAllDomains
  };

  function getTechnicalUser(domainId) {
    return new Promise((resolve, reject) => {
      coreTechnicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, domainId, (err, technicalUsers) => {
        if (err) return reject(err);

        if (!technicalUsers || !technicalUsers.length) {
          return reject(new Error(`No technical user found for domain ${domainId}`));
        }

        resolve(technicalUsers[0]);
      });
    });
  }

  function getTechnicalToken(technicalUser) {
    return new Promise((resolve, reject) => {
      coreTechnicalUser.getNewToken(technicalUser, TOKEN_TTL, (err, data) => {
        if (err) return reject(err);

        if (!data) {
          return reject(new Error('Can not generate technical token'));
        }

        return resolve(data.token);
      });
    });
  }

  function isFeatureEnabled(domainId) {
    return new EsnConfig('linagora.esn.contact', domainId).get('features')
      .then(config => config && config.isDomainMembersAddressbookEnabled);
  }

  /**
   * Submit sunchronization job
   * @param {String} domainId Target domain to synchronize domain members address book
   * @param {Boolean} force force synchronize even if the domain member address book is created.
   *                        Use to update contacts in the address book. Default set to true
   */
  function submitSynchronizationJob(domainId, force = true) {
    return submitJob(DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME.SINGLE_DOMAIN, { domainId, force });
  }

  function submitSynchronizationJobForAllDomains() {
    return submitJob(DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME.ALL_DOMAINS, {});
  }
};
