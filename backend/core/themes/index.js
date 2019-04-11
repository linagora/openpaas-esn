const EsnConfig = require('../esn-config').EsnConfig;
const pubsub = require('../pubsub').global;
const { UPDATED_TOPIC_NAME } = require('./constants');

module.exports = {
  saveTheme,
  getTheme
};

function saveTheme(domainId, newThemesConfig) {
  const themesConfig = {
    name: 'themes',
    value: newThemesConfig
  };

  return new EsnConfig('core', domainId).set(themesConfig)
    .then(config => {
      const theme = config || {};

      pubsub.topic(UPDATED_TOPIC_NAME).publish({ domainId, theme });

      return theme;
    });
}

function getTheme(domainId) {
  return new EsnConfig('core', domainId).get('themes').then(config => config || {});
}
