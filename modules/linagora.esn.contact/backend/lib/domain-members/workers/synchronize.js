module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');
  const synchronize = require('../synchronize')(dependencies);
  const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../contants');

  return {
    name: DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME,
    handler: {
      handle,
      getTitle
    }
  };

  function handle(job) {
    const { domainId } = job.data;
    const config = esnConfig('features').inModule('linagora.esn.contact');

    config.esnConfig.setDomainId(domainId);

    return config.get()
      .then(features => {
        if (!features || !features.isDomainMembersAddressbookEnabled) {
          return Promise.reject(new Error(`Can not synchronize domain member address book for domain ${domainId} due to the feature is disabled`));
        }

        return synchronize(domainId);
      });
  }

  function getTitle(jobData) {
    return `Synchronize domain member contacts for domain ${jobData.domainId}`;
  }
};
