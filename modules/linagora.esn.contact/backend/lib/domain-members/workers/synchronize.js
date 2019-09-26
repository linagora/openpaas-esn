const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../contants');

module.exports = dependencies => {
  const { isFeatureEnabled } = require('../utils')(dependencies);
  const synchronize = require('../synchronize')(dependencies);

  return {
    name: DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME,
    handler: {
      handle,
      getTitle
    }
  };

  function handle(job) {
    const { domainId } = job.data;

    return isFeatureEnabled(domainId)
      .then(isEnabled => {
        if (!isEnabled) {
          return Promise.reject(new Error(`Can not synchronize domain member address book for domain ${domainId} due to the feature is disabled`));
        }

        return synchronize(domainId);
      });
  }

  function getTitle(jobData) {
    return `Synchronize domain member contacts for domain ${jobData.domainId}`;
  }
};
