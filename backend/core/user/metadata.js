const metadataConfig = require('../esn-config')('userMetadata');

module.exports = user => {
  return {
    get,
    set
  };

  function get(key) {
    return metadataConfig.forUser(user, true).get(key);
  }

  function set(key, value) {
    return metadataConfig.forUser(user, true).set(key, value);
  }
};
