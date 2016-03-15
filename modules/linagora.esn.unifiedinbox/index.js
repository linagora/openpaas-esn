'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var unifiedInboxModule = new AwesomeModule('linagora.esn.unifiedinbox', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.io.mailer', 'mailer')
  ],
  states: {
    lib: function(dependencies, callback) {
      var inbox = require('./backend/webserver/api/inbox/router')(dependencies);

      var lib = {
        api: {
          inbox: inbox
        }
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/', this.api.inbox);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('unifiedinbox', [
        'app.js',
        'constants.js',
        'controllers.js',
        'services.js',
        'filters.js',
        'models.js',
        'directives/main.js',
        'directives/subheaders.js',
        'directives/header.js',
        'services/twitter.js'
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
