module.exports = dependencies => {
  const peopleModule = dependencies('people');
  const resolver = require('./resolver')(dependencies);
  const searcher = require('./searcher')(dependencies);
  const denormalizer = require('./denormalizer')(dependencies);
  const RESOLVER_PRIORITY = 80;

  return {
    init
  };

  function init() {
    peopleModule.service.addSearcher(new peopleModule.PeopleSearcher('contact', searcher, denormalizer));
    peopleModule.service.addResolver(new peopleModule.PeopleResolver('contact', resolver, denormalizer, RESOLVER_PRIORITY));
  }
};
