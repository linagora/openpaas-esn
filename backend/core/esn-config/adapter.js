'use strict';

var EsnConfig = require('./esn-config');
var constants = require('./constants');
var core = require('./core');

var DEFAULT_MODULE = constants.DEFAULT_MODULE;
var DEFAULT_DOMAIN_ID = constants.DEFAULT_DOMAIN_ID;

function Adapter(configName) {
  this.configName = configName;
  this.esnConfig = new EsnConfig(DEFAULT_MODULE, DEFAULT_DOMAIN_ID);
}

Adapter.prototype.inModule = function(moduleName) {
  this.esnConfig.setModuleName(moduleName);

  return this;
};

Adapter.prototype.forUser = function(user, isUserWide = false) {
  if (!user) {
    return this;
  }

  const domainId = user.preferredDomainId ? user.preferredDomainId : DEFAULT_DOMAIN_ID;

  this.esnConfig.setDomainId(domainId);

  if (isUserWide) {
    this.esnConfig.setUserId(user._id);
  }

  return this;
};

Adapter.prototype.get = function(key, callback) {
  return core.get(this.esnConfig, this.configName, key, callback);
};

Adapter.prototype.set = function(key, value, callback) {
  return core.set(this.esnConfig, this.configName, key, value, callback);
};

Adapter.prototype.store = function(value, callback) {
  return core.store(this.esnConfig, this.configName, value, callback);
};

Adapter.prototype.getFromAllDomains = function(callback) {
  return core.getFromAllDomains(this.esnConfig, this.configName, callback);
};

module.exports = Adapter;
