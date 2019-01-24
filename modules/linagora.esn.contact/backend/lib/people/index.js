module.exports = dependencies => {
  const peopleModule = dependencies('people');
  const resolver = require('./resolver')(dependencies);
  const denormalizer = require('./denormalizer')(dependencies);

  return {
    init
  };

  function init() {
    peopleModule.service.addResolver(new peopleModule.PeopleResolver('contact', resolver, denormalizer));
  }
};
