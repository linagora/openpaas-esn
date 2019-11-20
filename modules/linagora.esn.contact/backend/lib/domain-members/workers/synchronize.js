const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../contants');

module.exports = dependencies => {
  const { isFeatureEnabled } = require('../utils')(dependencies);
  const synchronize = require('../synchronize')(dependencies);
  const {
    createDomainMembersAddressbook,
    getDomainMembersAddressbook,
    getClientOptionsForDomain,
    removeDomainMembersAddressbook
  } = require('../addressbook')(dependencies);

  return {
    name: DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME.SINGLE_DOMAIN,
    handler: {
      handle,
      getTitle
    }
  };

  function handle(job) {
    const { domainId, force } = job.data;

    return getClientOptionsForDomain(domainId)
      .then(options => Promise.all([
        getDomainMembersAddressbook(domainId, options),
        isFeatureEnabled(domainId)
      ])
        .then(result => {
          const domainMemberAddressBook = result[0];
          const isEnabled = result[1];

          if (!isEnabled && domainMemberAddressBook) {
            return removeDomainMembersAddressbook(domainId, options);
          }

          if (isEnabled && !domainMemberAddressBook) {
            return createDomainMembersAddressbook(domainId, options)
              .then(() => synchronize(domainId));
          }

          if (isEnabled && domainMemberAddressBook && force) {
            return synchronize(domainId);
          }
        }));
  }

  function getTitle(jobData) {
    return `Synchronize domain member contacts for domain ${jobData.domainId}`;
  }
};
