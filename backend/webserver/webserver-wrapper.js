'use strict';

var AwesomeModule = require('awesome-module');
var util = require('util');

function WebServerWrapper(server) {
  var webserver = server;

  function asArray(values) {
    var array = util.isArray(values) ? values : [values];
    return array;
  }

  this.injectJS = function injectJS(namespace, js, innerApps) {
    webserver.addJSInjection(namespace, asArray(js), asArray(innerApps));
  };

  /**
  * inject less files.
  * This allows your less files to use the OpenPaaS @variables and mixins.
  *
  * 2 forms:
  * - a filename '/path/to/some/file.less'
  * - an object with properties {filename: String, priority: Number}
  *
  * Default priority is 0, higher priority is included first.
  */
  this.injectLess = function injectLess(namespace, less, innerApps) {
    webserver.addLessInjection(namespace, asArray(less), asArray(innerApps));
  };

  this.injectAngularModules = function injectAngularModules(namespace, js, moduleNames, innerApps) {
    webserver.addAngularModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps));
  };

  this.injectAngularAppModules = function injectAngularAppModules(namespace, js, moduleNames, innerApps, opts = {}) {
    webserver.addAngularAppModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps), opts);
  };

  this.addApp = function addApp(namespace, expressApp) {
    webserver.application.use('/' + namespace, expressApp);
  };

  this.on = webserver.on.bind(webserver);
}

var server = require('./').webserver;
var awesomeWebServerWrapper = new AwesomeModule(require('../module-manager').ESN_MODULE_PREFIX + 'webserver.wrapper', {
  states: {
    lib: function(dependencies, callback) {
      var api = new WebServerWrapper(server);
      return callback(null, api);
    }
  },
  proxy: function(moduleName, trusted) {
    if (trusted) {
      return this;
    }
    var self = this;
    var proxyLib = {
      injectJS: function(js, innerApps) {
        return self.injectJS(moduleName, js, innerApps);
      },
      injectLess: function(less, innerApps) {
        return self.injectLess(moduleName, less, innerApps);
      },
      injectAngularModules: function(js, moduleNames, innerApps) {
        return self.injectAngularModules(moduleName, js, moduleNames, innerApps);
      },
      addApp: function(expressApp) {
        return self.addApp(moduleName, expressApp);
      }
    };
    return proxyLib;
  }
});

module.exports = awesomeWebServerWrapper;
