const _ = require('lodash');

module.exports = dependencies => {
  const { constants } = dependencies('esn-config');
  const pubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const { submitSynchronizationJob } = require('./utils')(dependencies);
  const jobQueue = dependencies('jobqueue').lib;
  const synchronizeWorker = require('./workers/synchronize')(dependencies);
  const synchronizeAllDomainsWorker = require('./workers/synchronizeAllDomains')(dependencies);

  return {
    init
  };

  function init() {
    jobQueue.addWorker(synchronizeWorker);
    jobQueue.addWorker(synchronizeAllDomainsWorker);

    logger.debug('Registering listener on domain members address book configuration update');
    pubsub.topic(constants.EVENTS.CONFIG_UPDATED).subscribe(_onESNConfigUpdate);
  }

  function _onESNConfigUpdate(data) {
    const { configsUpdated, moduleName, domainId } = data;
    const updatedConfig = _.find(configsUpdated, { name: 'features' });

    if (
      updatedConfig &&
      moduleName === 'linagora.esn.contact' &&
      domainId
    ) {
      return submitSynchronizationJob(domainId, false);
    }
  }
};
