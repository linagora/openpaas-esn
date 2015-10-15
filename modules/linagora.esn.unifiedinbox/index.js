'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

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
      webserverWrapper.injectAngularModules('unifiedinbox', [
        'app.js',
        'constants.js',
        'controllers.js',
        'directives.js',
        'services.js',
        'filters.js'
      ], 'linagora.esn.unifiedinbox', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('unifiedinbox', [lessFile], 'esn');
      webserverWrapper.addApp('unifiedinbox', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = unifiedInboxModule;
