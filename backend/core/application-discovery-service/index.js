const esnConfig = require('../esn-config');
const { EsnConfig } = esnConfig;
const CONFIG_NAME = 'applicationDiscoveryService';
const ADSConfig = esnConfig(CONFIG_NAME);

module.exports = {
  create,
  deleteById,
  getById,
  list,
  listForUserByType,
  toggleForDomain,
  toggleForPlatform,
  toggleForUser,
  update
};

/**
 * Create an application or service entry.
 *
 * @param {Object} ads
 */
function create(ads) {
  return ADSConfig.get()
    .then(configs => configs || [])
    .then(configs => ADSConfig.store([...configs, ads]));
}

/**
 * Delete an application or service entry.
 *
 * @param {String} id
 */
function deleteById(id) {
  return ADSConfig.get()
  .then(configs => configs || [])
  .then(configs => ADSConfig.store(configs.filter(config => config.id !== id)));
}

/**
 * List applications and services entries.
 */
function list() {
  return ADSConfig.get()
    .then(configs => getEnabledConfigs(configs))
    .then(configs => _normalizeConfigs(configs));

  function _normalizeConfigs(configs) {
    // eslint-disable-next-line no-unused-vars
    return configs.map(({ enabled, ...normalizedConfig }) => normalizedConfig);
  }
}

/**
 * List applications and services for a given user.
 *
 * @param {String} userId
 * @param {Object} options
 */
function listForUserByType(user, type) {
  return ADSConfig.inModule('core').forUser(user, true).get()
    .then(configs => getEnabledConfigs(configs))
    .then(configs => _getConfigsByType(configs));

  function _getConfigsByType(configs) {
    return type ?
    (configs || []).filter(config => config.type === type) :
    configs;
  }
}

/**
 * toggle SPA for domain
 *
 * @param {String} domainId
 * @param {Object} toggle { SPAId , enabled }
 */
function toggleForDomain(domainId, toggle) {
  const domainConfig = new EsnConfig('core', domainId);
  const { id, enabled } = toggle;

  return domainConfig.get(CONFIG_NAME)
    .then(configs => configs || [])
    .then(configs => toggleConfig(configs, id, enabled))
    .then(configs => domainConfig.set({ name: CONFIG_NAME, value: configs }));
}

/**
 * toggle SPA for platform.
 *
 * @param {Object} toggle { SPAId , enabled }
 */
function toggleForPlatform(toggle) {
  const { id, enabled } = toggle;

  return ADSConfig.get()
    .then(configs => configs || [])
    .then(configs => toggleConfig(configs, id, enabled))
    .then(configs => ADSConfig.store(configs));
}

/**
 * Toggle SPA for user.
 *
 * @param {Object} user
 * @param {Object} toggle { SPAId , enabled }
 */
function toggleForUser(user, toggle) {
  const userConfig = ADSConfig.inModule('core').forUser(user, true);
  const { id, enabled } = toggle;

  return userConfig.get()
    .then(configs => configs || [])
    .then(configs => toggleConfig(configs, id, enabled))
    .then(configs => userConfig.store(configs));
}

/**
 * Update an application or service entry by id.
 *
 * @param {String} id
 * @param {Object} ads
 */
function update(id, ads) {
  return ADSConfig.get()
    .then(configs => {
      const newConfigs = configs.map(config => (config.id === id ? { ...ads, enabled: config.enabled } : config));

      return ADSConfig.store(newConfigs);
    });
}

/**
 * Filter configs and remove disabled ones.
 *
 * @param {Array} configs
 */
function getEnabledConfigs(configs) {
  return (configs || []).filter(config => config.enabled);
}

/**
 * Toggle a config ( enabled, disabled )
 *
 * @param {Array} configList
 * @param {String} SPAId
 * @param {Boolean} isEnabled
 */
function toggleConfig(configList, SPAId, isEnabled) {
  return configList.map(config => (config.id === SPAId ? { ...config, enabled: isEnabled } : config));
}

/**
 * Get SPA by id
 *
 * @param {String} id
 */
function getById(id) {
  return ADSConfig.get()
    .then(configs => configs || [])
    .then(configs => configs.find(config => config.id === id));
}
