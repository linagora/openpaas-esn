'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var unifiedInboxModule = new AwesomeModule('linagora.esn.unifiedinbox', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
  ],
  states: {
    lib: function(dependencies, callback) {
      return callback(null, {});
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('unifiedinbox', ['app.js', 'controllers.js', 'directives.js', 'services.js'], 'linagora.esn.unifiedinbox', ['esn']);
      webserverWrapper.injectCSS('unifiedinbox', ['styles.css'], 'esn');
      webserverWrapper.addApp('unifiedinbox', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = unifiedInboxModule;
