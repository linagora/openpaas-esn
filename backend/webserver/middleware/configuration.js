'use strict';

const rights = require('../../core/esn-config/rights');

module.exports = {
  canWriteUserConfig,
  canReadUserConfig,
  canWriteAdminConfig,
  canReadAdminConfig,
  canWritePlatformConfig,
  canReadPlatformConfig
};

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
