module.exports = dependencies => {
  const logger = dependencies('logger');
  const {
    submitSynchronizationJob,
    submitSynchronizationJobForAllDomains
  } = require('../../../../lib/domain-members/utils')(dependencies);

  return submitJob;

  function submitJob(req, res) {
    const domainId = req.query.domain_id;

    const submitJob = domainId ? submitSynchronizationJob(domainId) : submitSynchronizationJobForAllDomains();

    return submitJob.then(jobId => {
      res.status(201).json({ jobId });
    })
    .catch(err => {
      const details = 'Failed to submit domain members address book synchronization job';

      logger.error(details, err);
      res.status(500).json({ error: { code: 500, response: 'Server Error', details }});
    });
  }
};
