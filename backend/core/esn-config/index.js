'use strict';

var Adapter = require('./adapter');
var EsnConfig = require('./esn-config');

module.exports = function(configName) {
  return new Adapter(configName);
};
module.exports.EsnConfig = EsnConfig;
