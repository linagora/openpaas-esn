const _ = require('lodash');
const esnConfig = require('../../core/esn-config');

module.exports = {
  requiresModuleIsEnabled,
  requiresModuleIsEnabledInCurrentDomain
};

function requiresModuleIsEnabled(moduleName) {
  return (req, res, next) => {
    esnConfig('modules')
      .inModule('core')
      .get()
      .then(modules => {
        if (!isModuleEnabled(moduleName, modules)) {
          return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Module is not available'}});
        }

        next();
      })
      .catch(() => {
        res.status(500).json({error: {code: 500, message: 'Internal Server Error', details: 'Error while resolving user configuration'}});
      });
  };
}

function requiresModuleIsEnabledInCurrentDomain(moduleName) {
  return (req, res, next) => {
    esnConfig('modules')
      .inModule('core')
      .forUser(req.user)
      .get()
      .then(modules => {
        if (!isModuleEnabled(moduleName, modules)) {
          return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Module is not available'}});
        }

        next();
      })
      .catch(() => {
        res.status(500).json({error: {code: 500, message: 'Internal Server Error', details: 'Error while resolving user configuration'}});
      });
  };
}

function isModuleEnabled(moduleName, modules = []) {
  const moduleConfiguration = _.find(modules, { id: moduleName }) || {};

  return _.has(moduleConfiguration, 'enabled') ? moduleConfiguration.enabled : true;
}
