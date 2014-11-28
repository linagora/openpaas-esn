'use strict';

var Path = require('path');
var fs = require('fs');
var core = require('../core');
var AwesomeModuleManager = require('awesome-module-manager');
var AwesomeModule = require('awesome-module');
var ESN_MODULE_PREFIX = 'linagora.esn.core.';
var ESN_MIDDLEWARE_PREFIX = ESN_MODULE_PREFIX + 'webserver.middleware.';
var setupServer = require('./server');

var manager = new AwesomeModuleManager(core.logger);

function mockModule(name, lib) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    states: {
      lib: function(deps, callback) {
        return callback(null, lib);
      }
    }
  });
  var loader = manager.loaders.code(mock, true);
  manager.appendLoader(loader);
}

function mockCoreModule(name) {
  var mock = new AwesomeModule(ESN_MODULE_PREFIX + name, {
    states: {
      lib: function(deps, callback) {
        return callback(null, core[name]);
      }
    }
  });
  var loader = manager.loaders.code(mock, true);
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

function mockMiddlewares() {
  var middlewarePath = __dirname + '/../webserver/middleware';
  var middlewares = [
    'activitystream',
    'authentication',
    'authorization',
    'community',
    'conference',
    'cookie-lifetime',
    'feedback',
    'file',
    'link',
    'login-rules',
    'message',
    'notification',
    'request',
    'setup-routes',
    'setup-sessions',
    'setup-settings',
    'startup-buffer',
    'templates',
    'usernotifications',
    'verify-recaptcha'
  ];

  middlewares.forEach(function(name) {
    var moduleName = ESN_MIDDLEWARE_PREFIX + name;
    var mock = new AwesomeModule(moduleName, {
      states: {
        lib: function(deps, callback) {
          return callback(null, require(middlewarePath + '/' + name));
        }
      }
    });
    var loader = manager.loaders.code(mock, true);
    manager.appendLoader(loader);
  });
}

function setupManager() {
  mockCore();
  mockMiddlewares();
  core.moduleManager = manager;
  return manager;
}

function setupServerEnvironment() {
  setupServer(module.exports);
}

module.exports.setupManager = setupManager;
module.exports.ESN_MODULE_PREFIX = ESN_MODULE_PREFIX;
module.exports.ESN_MIDDLEWARE_PREFIX = ESN_MIDDLEWARE_PREFIX;
module.exports.manager = manager;
module.exports.mockModule = mockModule;
module.exports.setupServerEnvironment = setupServerEnvironment;
