module.exports = dependencies => {
  const jobQueue = dependencies('jobqueue');
  const pubsub = require('./pubsub')(dependencies);
  const search = require('./search')(dependencies);
  const davImport = require('./dav-import')(dependencies);
  const people = require('./people')(dependencies);
  const synchronizeDomainMemberContactsWorker = require('./domain-members/workers/synchronize')(dependencies);

  function start(callback) {
    pubsub.listen();
    search.init();
    davImport.init();
    people.init();
    jobQueue.lib.addWorker(synchronizeDomainMemberContactsWorker);

    callback();
  }

  return {
    start: start,
    search: search,
    davClient: require('./dav-client'),
    client: require('./client')(dependencies),
    constants: require('./constants'),
    helper: require('./helper')
  };
};
