const q = require('q');
const _ = require('lodash');
const registry = require('../registry');

module.exports = {
  validate
};

function validate(moduleName, configName, value) {
  const module = registry.getFromModule(moduleName);

  if (!module) {
    return q({
      ok: false,
      message: `No such module: ${moduleName}`
    });
  }

  const config = module.configurations[configName];

  if (!config) {
    return q({
      ok: false,
      message: `No such configuration ${configName} in module ${moduleName}`
    });
  }

  if (_.isUndefined(value)) {
    return q({
      ok: false,
      message: 'The value is required'
    });
  }

  const validator = config.validator || defaultValidator;
  const result = validator(value);

  return q().then(() => result).then(message => ({
    ok: !message,
    message
  }));
}

function defaultValidator() {
  return null;
}
