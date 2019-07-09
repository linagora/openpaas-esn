const { IMPORT } = require('../constants').JOBQUEUE_WORKER_NAMES;

module.exports = dependencies => {
  const importerRegistry = require('../registry')(dependencies);
  const {
    getImporterOptions,
    initializeAddressBook
  } = require('../helper')(dependencies);

  return {
    name: IMPORT,
    handler: {
      handle,
      getTitle
    }
  };

  function handle(job) {
    const { user, account } = job.data;
    const importer = importerRegistry.get(account.data.provider);

    if (!importer || !importer.lib || !importer.lib.importer) {
      return Promise.reject(new Error(`Can not find importer ${account.data.provider}`));
    }

    return getImporterOptions(user, account)
      .then(initializeAddressBook)
      .then(importer.lib.importer.importContact);
  }

  function getTitle(jobData) {
    return `Import ${jobData.account.data.provider} contacts for user ${jobData.user._id}`;
  }
};
