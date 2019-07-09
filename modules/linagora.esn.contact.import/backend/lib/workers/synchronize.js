const { SYNCHRONIZE } = require('../constants').JOBQUEUE_WORKER_NAMES;

module.exports = dependencies => {
  const importerRegistry = require('../registry')(dependencies);
  const {
    cleanOutdatedContacts,
    getImporterOptions,
    initializeAddressBook
  } = require('../helper')(dependencies);

  return {
    name: SYNCHRONIZE,
    handler: {
      handle,
      getTitle
    }
  };

  function handle(job) {
    const { user, account } = job.data;
    const contactSyncTimeStamp = Date.now();
    const importer = importerRegistry.get(account.data.provider);

    if (!importer || !importer.lib || !importer.lib.importer) {
      return Promise.reject(new Error(`Can not find importer ${account.data.provider}`));
    }

    return getImporterOptions(user, account)
      .then(initializeAddressBook)
      .then(options => importer.lib.importer.importContact(options)
        .then(() => cleanOutdatedContacts(options, contactSyncTimeStamp))
      );
  }

  function getTitle(jobData) {
    return `Synchronize ${jobData.account.data.provider} contacts for user ${jobData.user._id}`;
  }
};
