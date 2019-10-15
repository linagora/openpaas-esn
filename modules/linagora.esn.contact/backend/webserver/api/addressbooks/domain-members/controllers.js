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
      .then(jobId => {
        logger.debug(`Submit domain members address book synchronization job in domain. Domain id: ${domainId}`);
        res.status(201).json([{ jobId, domainId }]);
      })
      .catch(err => {
        const details = `Failed to submit domain members address book synchronization job. Domain id: ${domainId}`;

        logger.error(details, err);
        res.status(500).json({ error: { code: 500, response: 'Server Error', details }});
      });
  }

  function _submitJobsOfAllDomains(req, res) {
    const cursor = listByCursor();

    return submitJobsOverDomains({ cursor, submitedJobs: [] }).then(submitedJobs => {
      logger.debug(`Submit ${submitedJobs.length} domain members address book synchronization jobs in platform`);
      res.status(201).json(submitedJobs);
    }).catch(err => {
      const details = 'Failed to submit domain members address book synchronization jobs for all domains';

      logger.error(details, err);

      return res.status(500).json({ error: { code: 500, response: 'Server Error', details }});
    });
  }

  function submitJobsOverDomains({ cursor, submitedJobs }) {
    return cursor.next().then(domain => {
      if (!domain) return submitedJobs;

      return isFeatureEnabled(domain._id).then(isEnabled => {
        if (!isEnabled) return submitJobsOverDomains({ cursor, submitedJobs });

        return submitSynchronizationJob(domain._id).then(jobId => {
          submitedJobs.push({ jobId, domainId: domain._id });

          return submitJobsOverDomains({ cursor, submitedJobs });
        });
      }).catch(err => {
        const details = `Failed to submit domain members address book synchronization job. Domain id: ${domain._id}`;

        logger.error(details, err);

        return submitJobsOverDomains({ cursor, submitedJobs });
      });
    });
  }
};
