module.exports = dependencies => {
  const jobQueue = dependencies('jobqueue');
  const contactModule = dependencies('contact');
  const logger = dependencies('logger');
  const importerRegistry = require('./registry')(dependencies);
  const helper = require('./helper')(dependencies);
  const {
    ACCOUNT_ERROR,
    API_CLIENT_ERROR,
    CONTACT_CLIENT_ERROR
  } = require('../constants').CONTACT_IMPORT_ERROR;

  return {
    buildErrorMessage,
    createContact,
    importAccountContacts,
    importAccountContactsByJobQueue,
    synchronizeAccountContacts,
    synchronizeAccountContactsByJobQueue
  };

  function importAccountContacts(user, account) {
    const importer = importerRegistry.get(account.data.provider);

    if (!importer || !importer.lib || !importer.lib.importer) {
      return Promise.reject(new Error(`Can not find importer ${account.data.provider}`));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(importer.lib.importer.importContact);
  }

  function synchronizeAccountContacts(user, account) {
    const contactSyncTimeStamp = Date.now();
    const importer = importerRegistry.get(account.data.provider);

    if (!importer || !importer.lib || !importer.lib.importer) {
      return Promise.reject(new Error(`Can not find importer ${account.data.provider}`));
    }

    return helper.getImporterOptions(user, account)
      .then(helper.initializeAddressBook)
      .then(options => importer.lib.importer.importContact(options)
        .then(helper.cleanOutdatedContacts.bind(null, options, contactSyncTimeStamp))
      );
  }

  function importAccountContactsByJobQueue(user, account) {
    const workerName = ['contact', account.data.provider, 'import'].join('-');
    const jobName = [workerName, user.id, account.data.id, Date.now()].join('-');

    return jobQueue.lib.submitJob(workerName, jobName, { user, account });
  }

  function synchronizeAccountContactsByJobQueue(user, account) {
    const workerName = ['contact', account.data.provider, 'sync'].join('-');
    const jobName = [workerName, user.id, account.data.id, Date.now()].join('-');

    return jobQueue.lib.submitJob(workerName, jobName, { user, account });
  }

  function buildErrorMessage(type, errorObject) {
    if (type === API_CLIENT_ERROR && errorObject.statusCode) {
      const statusCode = errorObject.statusCode;

      if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
        type = ACCOUNT_ERROR;
      }
    }

    return {
      type,
      errorObject
    };
  }

  function createContact(vcard, options) {
    const contactId = vcard.getFirstPropertyValue('uid');
    const jsonCard = vcard.toJSON();

    return contactModule.lib.client({
        ESNToken: options.esnToken,
        user: options.user
      })
      .addressbookHome(options.user._id)
      .addressbook(options.addressbook.id)
      .vcard(contactId)
      .create(jsonCard)
      .catch(err => {
        logger.error('Error while inserting contact to DAV', err);

        return Promise.reject(buildErrorMessage(CONTACT_CLIENT_ERROR, err));
      });
  }
};
