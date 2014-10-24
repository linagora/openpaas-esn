'use strict';

var Path = require('path');
var fs = require('fs');
var core = require('../core');
var AwesomeModuleManager = require('awesome-module-manager');
var AwesomeModule = require('awesome-module');
var ESN_MODULE_PREFIX = 'linagora.esn.core.';



var manager = new AwesomeModuleManager(core.logger);

function mockModule(name, lib) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    lib: function(deps, callback) {
      return callback(null, lib);
    }
  });
  var loader = manager.loaders.code(mock);
  manager.appendLoader(loader);
}

function mockCoreModule(name) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    lib: function(deps, callback) {
      return callback(null, core[name]);
    }
  });
  var loader = manager.loaders.code(mock);
  manager.appendLoader(loader);
}

function mockCore() {
  var corePath = Path.join(__dirname, '..', 'core');
  fs.readdirSync(corePath).forEach(function(filename) {
    var modPath = Path.join(corePath, filename);
    var stat = fs.statSync(modPath);
    if (!stat.isDirectory()) { return; }
    mockCoreModule(filename);
  });
}

function setupManager() {
  mockCore();
  core.moduleManager = manager;
  return manager;
}

module.exports.setupManager = setupManager;
module.exports.ESN_MODULE_PREFIX = ESN_MODULE_PREFIX;
module.exports.manager = manager;
module.exports.mockModule = mockModule;
