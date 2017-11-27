'use strict';

const q = require('q');
const composableMw = require('composable-middleware');
const platformadminsMW = require('./platformadmins');
const helperMW = require('./helper');
const domainMW = require('./domain');
const authorizationMW = require('./authorization');
const logger = require('../../core/logger');
const rights = require('../../core/esn-config/rights');
const validator = require('../../core/esn-config/validator');
const { SCOPE } = require('../../core/esn-config/constants');

module.exports = {
  qualifyScopeQueries,
  checkAuthorizedRole,
  checkReadPermission,
  checkWritePermission,
  ensureWellformedBody,
  validateWriteBody
};

function qualifyScopeQueries(req, res, next) {
  const scope = req.query.scope;

  if (scope === SCOPE.platform) {
    delete req.query.domain_id;
    delete req.query.user_id;
  } else if (scope === SCOPE.domain) {
    delete req.query.user_id;
  } else if (scope === SCOPE.user) {
    req.query.user_id = req.user.id;
    req.query.domain_id = req.user.preferredDomainId;
  } else {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'scope must be either platform, domain or user'
      }
    });
  }

  next();
}

function checkAuthorizedRole(req, res, next) {
  const scope = req.query.scope;
  const middlewares = [];

  if (scope === SCOPE.platform) {
    middlewares.push(platformadminsMW.requirePlatformAdmin);
  } else if (scope === SCOPE.domain) {
    middlewares.push(helperMW.requireInQuery('domain_id', 'when scope is domain, domain_id is required'));
    middlewares.push(domainMW.loadFromDomainIdParameter);
    middlewares.push(authorizationMW.requiresDomainManager);
  }

  return composableMw(...middlewares)(req, res, next);
}

function checkReadPermission(req, res, next) {
  const scope = req.query.scope;
  const middlewares = [];

  if (scope === SCOPE.platform) {
    middlewares.push(canReadPlatformConfig);
  } else if (scope === SCOPE.domain) {
    middlewares.push(canReadAdminConfig);
  } else if (scope === SCOPE.user) {
    middlewares.push(canReadUserConfig);
  }

  return composableMw(...middlewares)(req, res, next);
}

function checkWritePermission(req, res, next) {
  const scope = req.query.scope;
  const middlewares = [];

  if (scope === SCOPE.platform) {
    middlewares.push(canWritePlatformConfig);
  } else if (scope === SCOPE.domain) {
    middlewares.push(canWriteAdminConfig);
  } else if (scope === SCOPE.user) {
    middlewares.push(canWriteUserConfig);
  }

  return composableMw(...middlewares)(req, res, next);
}

function ensureWellformedBody(req, res, next) {
  const modules = req.body;
  let message;

  modules.some(module => {
    if (!module) {
      message = 'one of modules in array is null';

      return true;
    }

    if (!module.name) {
      message = 'one of modules in array does not have name';

      return true;
    }
  });

  if (message) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: `body data is not well-formed: ${message}`
      }
    });
  }

  next();
}

function validateWriteBody(req, res, next) {
  const modules = req.body;

  const invalidModules = modules.map(module => {
    if (!Array.isArray(module.configurations)) {
      return module.name;
    }

    return module.configurations.some(configuration => !configuration.name) ? module.name : null;
  }).filter(Boolean);

  if (invalidModules.length > 0) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: `module ${invalidModules.join(', ')} must have "configurations" attribute as an array of {name, value}`
      }
    });
  }

  const validationPromises = modules.map(module =>
    module.configurations.map(configuration =>
      validator.validate(module.name, configuration.name, configuration.value).then(result => ({
        moduleName: module.name,
        configName: configuration.name,
        result
      }))
    )
  );

  q.all([].concat(...validationPromises)).then(validations => {
    const invalidValidations = validations.filter(validation => !validation.result.ok);

    if (invalidValidations.length > 0) {
      const details = invalidValidations.map(validation =>
        `${validation.moduleName}->${validation.configName}: ${validation.result.message}`
      ).join('; ');

      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details
        }
      });
    }

    next();
  }, err => {
    const details = 'Error while validating configurations';

    logger.error(details, err);

    return res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details
      }
    });
  });
}

function canWriteUserConfig(req, res, next) {
  const modules = req.body;

  const hasUnwritableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.configurations)) {
      return true;
    }

    return module.configurations.some(config => {
      if (!config) {
        return true;
      }

      return !rights.userCanWrite(module.name, config.name);
    });
  });

  if (hasUnwritableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not writable'
      }
    });
  }

  next();
}

function canReadUserConfig(req, res, next) {
  const modules = req.body;

  const hasUnreadableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.keys)) {
      return true;
    }

    return module.keys.some(key => !rights.userCanRead(module.name, key));
  });

  if (hasUnreadableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not readable'
      }
    });
  }

  next();
}

function canWriteAdminConfig(req, res, next) {
  const modules = req.body;

  const hasUnwritableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.configurations)) {
      return true;
    }

    return module.configurations.some(config => {
      if (!config) {
        return true;
      }

      return !rights.adminCanWrite(module.name, config.name);
    });
  });

  if (hasUnwritableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not writable'
      }
    });
  }

  next();
}

function canReadAdminConfig(req, res, next) {
  const modules = req.body;

  const hasUnreadableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.keys)) {
      return true;
    }

    return module.keys.some(key => !rights.adminCanRead(module.name, key));
  });

  if (hasUnreadableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not readable'
      }
    });
  }

  next();
}

function canWritePlatformConfig(req, res, next) {
  const modules = req.body;

  const hasUnwritableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.configurations)) {
      return true;
    }

    return module.configurations.some(config => {
      if (!config) {
        return true;
      }

      return !rights.padminCanWrite(module.name, config.name);
    });
  });

  if (hasUnwritableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not writable'
      }
    });
  }

  next();
}

function canReadPlatformConfig(req, res, next) {
  const modules = req.body;

  const hasUnreadableConfig = modules.some(module => {
    if (!module || !Array.isArray(module.keys)) {
      return true;
    }

    return module.keys.some(key => !rights.padminCanRead(module.name, key));
  });

  if (hasUnreadableConfig) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad Request',
        details: 'Configurations are not readable'
      }
    });
  }

  next();
}
