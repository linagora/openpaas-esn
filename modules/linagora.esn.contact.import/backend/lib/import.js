const { IMPORT, SYNCHRONIZE } = require('./constants').JOBQUEUE_WORKER_NAMES;

module.exports = dependencies => {
  const jobQueue = dependencies('jobqueue');
  const contactModule = dependencies('contact');
  const logger = dependencies('logger');
  const {
    ACCOUNT_ERROR,
    API_CLIENT_ERROR,
    CONTACT_CLIENT_ERROR
  } = require('../constants').CONTACT_IMPORT_ERROR;

  return {
    buildErrorMessage,
    createContact,
    importAccountContactsByJobQueue,
    synchronizeAccountContactsByJobQueue
  };

  function importAccountContactsByJobQueue(user, account) {
    return jobQueue.lib.submitJob(IMPORT, { user, account });
  }

  function synchronizeAccountContactsByJobQueue(user, account) {
    return jobQueue.lib.submitJob(SYNCHRONIZE, { user, account });
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
