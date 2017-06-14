'use strict';

var EsnConfig = require('./esn-config');
var constants = require('./constants');
var core = require('./core');

var DEFAULT_MODULE = constants.DEFAULT_MODULE;
var DEFAULT_DOMAIN_ID = constants.DEFAULT_DOMAIN_ID;

class Adapter {
  constructor(configName) {
    this.configName = configName;
    this.esnConfig = new EsnConfig(DEFAULT_MODULE, DEFAULT_DOMAIN_ID);
  }

  inModule(moduleName) {
    this.esnConfig.setModuleName(moduleName);

    return this;
  }

  forUser(user, isUserWide = false) {
    if (!user) {
      return this;
    }

    const domainId = user.preferredDomainId ? user.preferredDomainId : DEFAULT_DOMAIN_ID;

    this.esnConfig.setDomainId(domainId);

    if (isUserWide) {
      this.esnConfig.setUserId(user._id);
    }

    return this;
  }

  get(key, callback) {
    return core.get(this.esnConfig, this.configName, key, callback);
  }

  set(key, value, callback) {
    return core.set(this.esnConfig, this.configName, key, value, callback);
  }

  store(value, callback) {
    return core.store(this.esnConfig, this.configName, value, callback);
  }

  getFromAllDomains(callback) {
    return core.getFromAllDomains(this.esnConfig, this.configName, callback);
  }

  onChange(listener) {
    return this.esnConfig.onChange(this.configName, listener);
  }
}

module.exports = Adapter;
