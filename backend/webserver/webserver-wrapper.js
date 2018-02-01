'use strict';

const util = require('util'),
      AwesomeModule = require('awesome-module'),
      coreFrontendInjections = require('./core-frontend-injections');

function WebServerWrapper(server) {
  var webserver = server;

  function asArray(values) {
    return util.isArray(values) ? values : [values];
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

  this.injectAngularModules = function injectAngularModules(namespace, js, moduleNames, innerApps, opts = {}) {
    webserver.addAngularModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps), opts);
  };

  this.injectAngularAppModules = function injectAngularAppModules(namespace, js, moduleNames, innerApps, opts = {}) {
    webserver.addAngularAppModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps), opts);
  };

  this.addApp = function addApp(namespace, expressApp) {
    webserver.application.use('/' + namespace, expressApp);
  };

  this.requestCoreFrontendInjections = function(innerApps, angularModules) {
    coreFrontendInjections(this, innerApps, angularModules);
  };

  this.on = webserver.on.bind(webserver);

  /**
   * This will inject Angular modules for the core when the webserver wrapper is first created
   * It will use all the available modules in the default innerApp: esn
   */
  this.requestCoreFrontendInjections();
}

var server = require('./').webserver;
var awesomeWebServerWrapper = new AwesomeModule(require('../module-manager').ESN_MODULE_PREFIX + 'webserver.wrapper', {
  states: {
    lib: (dependencies, callback) => callback(null, new WebServerWrapper(server))
  },
  proxy: function(moduleName, trusted) {
    if (trusted) {
      return this;
    }

    var self = this;

    return {
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
  }
});

module.exports = awesomeWebServerWrapper;
