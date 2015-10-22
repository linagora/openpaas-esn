'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var importContactModule = new AwesomeModule('linagora.esn.contact.import', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var lib = {
        lib: libModule
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(dependencies);
      webserverWrapper.addApp('importContact', app);
      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = importContactModule;
