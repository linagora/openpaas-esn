module.exports = dependencies => {
  const logger = dependencies('logger');
  const { listByCursor } = dependencies('domain');
  const { submitSynchronizationJob, isFeatureEnabled } = require('../../../../lib/domain-members/utils')(dependencies);

  return submitJob;

  function submitJob(req, res) {
    const domainId = req.query.domain_id;

    return domainId ? _submitJobForDomain(req, res, domainId) : _submitJobsOfAllDomains(req, res);
  }

  function _submitJobForDomain(req, res, domainId) {
    return submitSynchronizationJob(domainId)
      .then(() => {
        logger.debug(`Submit domain members address book synchronization job in domain. Domain id: ${domainId}`);
        res.status(201).json({
          numberOfSubmitedJobs: 1
        });
      })
      .catch(err => {
        const details = `Failed to submit domain members address book synchronization job. Domain id: ${domainId}`;

        logger.error(details, err);
        res.status(500).json({ error: { code: 500, response: 'Server Error', details }});
      });
  }

  function _submitJobsOfAllDomains(req, res) {
    const cursor = listByCursor();

    let numberOfSubmitedJobs = 0;

    function iterate() {
      return cursor.next().then(domain => {
        if (!domain) return;

        return isFeatureEnabled(domain._id).then(isEnabled => {
          if (!isEnabled) return iterate();

          return submitSynchronizationJob(domain._id).then(() => {
            numberOfSubmitedJobs++;

            return iterate();
          });
        }).catch(err => {
          const details = `Failed to submit domain members address book synchronization job. Domain id: ${domain._id}`;

          logger.error(details, err);

          return iterate();
        });
      });
    }

    return iterate().then(() => {
      logger.debug(`Submit ${numberOfSubmitedJobs} domain members address book synchronization jobs in platform`);
      res.status(201).json({
        numberOfSubmitedJobs
      });
    }).catch(err => {
      const details = 'Failed to submit domain members address book synchronization jobs for all domains';

      logger.error(details, err);

      return res.status(500).json({ error: { code: 500, response: 'Server Error', details }});
    });
  }
};
