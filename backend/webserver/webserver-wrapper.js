'use strict';

var AwesomeModule = require('awesome-module');
var util = require('util');
var css = require('../core').css;

function WebServerWrapper(server) {
  var webserver = server;

  function asArray(values) {
    var array = util.isArray(values) ? values : [values];
    return array;
  }

  this.injectJS = function injectJS(namespace, js, innerApps) {
    webserver.addJSInjection(namespace, asArray(js), asArray(innerApps));
  };

  this.injectCSS = function injectCSS(namespace, css, innerApps) {
    webserver.addCSSInjection(namespace, asArray(css), asArray(innerApps));
  };

  this.injectLess = function injectLess(namespace, less, innerApps) {
    css.addLessInjection(namespace, asArray(less), asArray(innerApps));
  };

  this.injectAngularModules = function injectAngularModules(namespace, js, moduleNames, innerApps) {
    webserver.addAngularModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps));
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
    var lib = this;
    var proxyLib = {
      injectJS: function(js, innerApps) {
        return lib.injectJS(moduleName, js, innerApps);
      },
      injectCSS: function(css, innerApps) {
        return lib.injectCSS(moduleName, css, innerApps);
      },
      injectLess: function(less, innerApps) {
        return lib.injectLess(moduleName, less, innerApps);
      },
      injectAngularModules: function(js, moduleNames, innerApps) {
        return lib.injectAngularModules(moduleName, js, moduleNames, innerApps);
      },
      addApp: function(expressApp) {
        return lib.addApp(moduleName, expressApp);
      }
    };
    return proxyLib;
  }
});

module.exports = awesomeWebServerWrapper;
