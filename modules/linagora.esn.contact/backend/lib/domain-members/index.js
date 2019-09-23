const _ = require('lodash');

module.exports = dependencies => {
  const {
    createDomainMembersAddressbook,
    removeDomainMembersAddressbook
  } = require('./addressbook')(dependencies);

  const { constants } = dependencies('esn-config');
  const pubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const jobQueue = dependencies('jobqueue').lib;
  const synchronizeDomainMemberContactsWorker = require('./workers/synchronize')(dependencies);

  return {
    init
  };

  function init() {
    jobQueue.addWorker(synchronizeDomainMemberContactsWorker);

    logger.debug('Registering listener on domain members address book configuration update');
    pubsub.topic(constants.EVENTS.CONFIG_UPDATED).subscribe(_onESNConfigUpdate);
  }

  function _onESNConfigUpdate(data) {
    const updatedConfig = _.find(data.configsUpdated, { name: 'features' });

    if (
      updatedConfig &&
      data.moduleName === 'linagora.esn.contact' &&
      data.domainId
    ) {
      if (updatedConfig.value && updatedConfig.value.isDomainMembersAddressbookEnabled) {
        return createDomainMembersAddressbook(data.domainId)
          .then(() => jobQueue.submitJob(synchronizeDomainMemberContactsWorker.name, { domainId: data.domainId }));
      }

      removeDomainMembersAddressbook(data.domainId);
    }
  }
};
