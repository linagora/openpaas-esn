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

  this.injectCSS = function injectCSS(namespace, css, innerApps) {
    webserver.addCSSInjection(namespace, asArray(css), asArray(innerApps));
  };

  this.injectAngularModules = function injectAngularModules(namespace, js, moduleNames, innerApps) {
    webserver.addAngularModulesInjection(namespace, asArray(js), asArray(moduleNames), asArray(innerApps));
  };

  this.addApp = function addApp(namespace, awesomeModule) {
    webserver.application.use('/' + namespace, awesomeModule);
  };

}

var server = require('./').webserver;
var awesomeWebServerWrapper = new AwesomeModule(require('../module-manager').ESN_MODULE_PREFIX + 'webserver.wrapper', {
  lib: function(dependencies, callback) {
    var api = new WebServerWrapper(server);
    return callback(null, api);
  }
});

module.exports = awesomeWebServerWrapper;
