'use strict';

var AwesomeModule = require('awesome-module');

function WebServerWrapper(server) {
  var webserver = server;

  function buildInjection(files, innerApps) {
    files = files instanceof Array ? files: [files];
    innerApps = innerApps instanceof Array ? innerApps: [innerApps];

    var injection = {};
    files.forEach(function(file) {
      injection[file] = innerApps;
    });
    return injection;
  }

  this.injectJS = function injectJS(namespace, js, innerApps) {
    webserver.addJSInjection(namespace, buildInjection(js, innerApps));
  };

  this.injectCSS = function injectCSS(namespace, css, innerApps) {
    webserver.addCSSInjection(namespace, buildInjection(css, innerApps));
  };

  this.addApp = function addApp(namespace, awesomeModule) {
    webserver.application.use('/' + namespace, awesomeModule);
  };

}

var server = require('./webserver').webserver;
var awesomeWebServerWrapper = new AwesomeModule(require('../module-manager').ESN_MODULE_PREFIX + 'webserver.wrapper', {
  lib: function(dependencies, callback) {
    var api = new WebServerWrapper(server);
    return callback(null, api);
  }
});

module.exports = awesomeWebServerWrapper;
