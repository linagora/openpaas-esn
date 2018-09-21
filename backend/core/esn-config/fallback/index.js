'use strict';

const q = require('q');
const _ = require('lodash');
const confModule = require('./configuration');
const mongoconfig = require('./mongoconfig');
const features = require('./features');
const registry = require('../registry');

let defaultConfig;

module.exports = {
  getConfiguration
};

/**
 * Get documents from three collections then merge to one to provide fallback
 * compatibility
 *
 * It also gets system-wide configuration to provide system-wide fallback when
 * the domain-wide configuration is not available.
 *
 * If userId is defined and not null, it will get user-wide configuration
 *
 * @param  {String|ObjectId} domainId The domain ID
 * @param  {String|ObjectId} userId The user ID
 * @return {Promise}
 */

function getConfiguration(domainId, userId) {
  return q.allSettled([
    mongoconfig.findByDomainId(domainId),
    domainId ? features.findByDomainId(null) : q.reject(),
    features.findByDomainId(domainId),
    domainId ? confModule.findConfigurationForDomain(null) : q.reject(),
    confModule.findConfigurationForDomain(domainId),
    userId ? confModule.findConfigurationForUser(domainId, userId) : q.reject()
  ])
  .then(function(data) {
    const fulFilledDocuments = data.map(function(doc) {
      return doc.state === 'fulfilled' ? doc.value : null;
    }).filter(Boolean);

    if (fulFilledDocuments.length === 0) {
      return q.reject(data[0].reason);
    }

    const mergedDoc = Object.create(null);

    fulFilledDocuments.forEach(function(doc) {
      mergeDocument(mergedDoc, _.cloneDeep(doc));
    });

    return _mergeWithDefaultConfig(mergedDoc);
  });

}

function mergeDocument(targetDoc, sourceDoc) {
  if (!targetDoc.modules) {
    targetDoc.modules = [];
  }

  if (sourceDoc.modules) {
    sourceDoc.modules.forEach(function(sourceModule) {
      var targetModule = _.find(targetDoc.modules, { name: sourceModule.name });

      if (targetModule) {
        sourceModule.configurations.forEach(function(config) {
          _.remove(targetModule.configurations, { name: config.name });
          targetModule.configurations.push(config);
        });
      } else {
        targetDoc.modules.push(sourceModule);
      }
    });
  }
}

function _mergeWithDefaultConfig(config) {
  _getRegisteredDefaultConfig().modules.forEach(sourceModule => {
    const targetModule = _.find(config.modules, { name: sourceModule.name });

    if (targetModule) {
      sourceModule.configurations.forEach(config => {
        const mergedConfig = _.merge({}, config, _.find(targetModule.configurations, { name: config.name }));

        _.remove(targetModule.configurations, { name: config.name });
        targetModule.configurations.push(mergedConfig);
      });
    } else {
      config.modules.push(sourceModule);
    }
  });

  return config;
}

function _getRegisteredDefaultConfig() {
  if (defaultConfig) {
    return defaultConfig;
  }

  const metadata = registry.getAll();
  const result = {
    modules: []
  };

  Object.keys(metadata).forEach(moduleName => {
    const config = [];
    const configurations = metadata[moduleName].configurations;

    Object.keys(configurations).forEach(configName => {
      if (configurations[configName].default) {
        config.push({
          name: configName,
          value: configurations[configName].default
        });
      }
    });

    config.length && result.modules.push({ name: moduleName, configurations: config });
  });

  defaultConfig = result;

  return result;
}
