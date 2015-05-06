'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var contactModule = new AwesomeModule('linagora.esn.contact', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    },
    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(this, dependencies);
      webserverWrapper.injectAngularModules('contacts', ['contact.js', 'controllers.js', 'directives.js', 'services.js'], 'linagora.esn.contact', ['esn']);
      webserverWrapper.addApp('contacts', app);
      return callback();
    },
    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = contactModule;
