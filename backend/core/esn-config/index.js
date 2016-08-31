'use strict';

var Adapter = require('./adapter');
var EsnConfig = require('./esn-config');
var constants = require('./constants');

module.exports = function(configName) {
  return new Adapter(configName);
};
module.exports.EsnConfig = EsnConfig;
module.exports.constants = constants;
