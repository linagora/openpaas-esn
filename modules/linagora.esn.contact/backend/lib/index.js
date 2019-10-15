module.exports = dependencies => {
  const pubsub = require('./pubsub')(dependencies);
  const search = require('./search')(dependencies);
  const davImport = require('./dav-import')(dependencies);
  const people = require('./people')(dependencies);
  const domainMembers = require('./domain-members')(dependencies);

  function start(callback) {
    pubsub.listen();
    search.init();
    davImport.init();
    people.init();
    domainMembers.init();

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
