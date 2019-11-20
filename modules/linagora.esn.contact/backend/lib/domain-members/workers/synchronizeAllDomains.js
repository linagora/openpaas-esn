const { DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME } = require('../contants');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const { listByCursor } = dependencies('domain');
  const { submitSynchronizationJob } = require('../utils')(dependencies);

  return {
    name: DOMAIN_MEMBERS_SYNCHRONIZE_WORKER_NAME.ALL_DOMAINS,
    handler: {
      handle,
      getTitle
    }
  };

  function handle() {
    return _submitJobsOfAllDomains();
  }

  function getTitle() {
    return 'Synchronize domain members addressbook for all domains';
  }

  function _submitJobsOfAllDomains() {
    const cursor = listByCursor();

    return _submitJobsOverDomains(cursor);
  }

  function _submitJobsOverDomains(cursor) {
    return cursor.next().then(domain => {
      if (!domain) return;

      return submitSynchronizationJob(domain._id)
        .then(_submitJobsOverDomains(cursor)
        .catch(err => {
          const details = `Failed to submit domain members address book synchronization job for domain: ${domain._id}`;

          logger.error(details, err);

          return _submitJobsOverDomains(cursor);
        }));
    });
  }
};
