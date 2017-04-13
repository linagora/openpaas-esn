'use strict';

const registry = require('./registry');

module.exports = {
  userCanRead,
  userCanWrite,
  adminCanRead,
  adminCanWrite,
  padminCanRead,
  padminCanWrite
};

function userCanRead(moduleName, configName) {
  return _can('user', 'r', moduleName, configName);
}

function userCanWrite(moduleName, configName) {
  return _can('user', 'w', moduleName, configName);
}

function adminCanRead(moduleName, configName) {
  return _can('admin', 'r', moduleName, configName);
}

function adminCanWrite(moduleName, configName) {
  return _can('admin', 'w', moduleName, configName);
}

function padminCanRead(moduleName, configName) {
  return _can('padmin', 'r', moduleName, configName);
}

function padminCanWrite(moduleName, configName) {
  return _can('padmin', 'w', moduleName, configName);
}

function _can(role, rights, moduleName, configName) {
  const module = registry.getFromModule(moduleName);

  if (!module) { return false; }
  const config = module.configurations[configName];

  if (!config) { return false; }

  const rightsObject = config.rights || module.rights;
  const roleRights = rightsObject && rightsObject[role];

  return roleRights && roleRights.indexOf(rights) !== -1;
}
