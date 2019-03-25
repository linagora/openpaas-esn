const EsnConfig = require('../esn-config').EsnConfig;

module.exports = {
  saveTheme,
  getTheme
};

function saveTheme(domainId, newThemesConfig) {
  const themesConfig = {
    name: 'themes',
    value: newThemesConfig
  };

return new EsnConfig('core', domainId).set(themesConfig).then(config => config || {});
}

function getTheme(domainId) {
  return new EsnConfig('core', domainId).get('themes').then(config => config || {});
}
