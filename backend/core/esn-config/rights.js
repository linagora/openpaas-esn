'use strict';

const registry = require('./registry');
const { ROLE } = require('./constants');
const READ = 'r';
const WRITE = 'w';

module.exports = {
  userCanRead,
  userCanWrite,
  adminCanRead,
  adminCanWrite,
  padminCanRead,
  padminCanWrite,
  can,
  READ,
  WRITE
};

function userCanRead(moduleName, configName) {
  return can(ROLE.user, READ, moduleName, configName);
}

function userCanWrite(moduleName, configName) {
  return can(ROLE.user, WRITE, moduleName, configName);
}

function adminCanRead(moduleName, configName) {
  return can(ROLE.admin, READ, moduleName, configName);
}

function adminCanWrite(moduleName, configName) {
  return can(ROLE.admin, WRITE, moduleName, configName);
}

function padminCanRead(moduleName, configName) {
  return can(ROLE.padmin, READ, moduleName, configName);
}

function padminCanWrite(moduleName, configName) {
  return can(ROLE.padmin, WRITE, moduleName, configName);
}

function can(role, rights, moduleName, configName) {
  const module = registry.getFromModule(moduleName);

  if (!module) { return false; }
  const config = module.configurations[configName];

  if (!config) { return false; }

  const rightsObject = config.rights || module.rights;
  const roleRights = rightsObject && rightsObject[role];

  return roleRights && roleRights.indexOf(rights) !== -1;
}
