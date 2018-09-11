module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');
  const metadata = require('./metadata')(dependencies);

  return {
    register
  };

  function register() {
    esnConfig.registry.register('linagora.esn.contact', metadata);
  }
};
