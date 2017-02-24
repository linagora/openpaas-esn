'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var unifiedInboxModule = new AwesomeModule('linagora.esn.unifiedinbox', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var inbox = require('./backend/webserver/api/inbox/router')(dependencies);
      var twitter = require('./backend/webserver/api/twitter/router')(dependencies);

      var lib = {
        api: {
          inbox: inbox,
          twitter: twitter
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies),
          webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules('unifiedinbox', [
        'app.js',
        'constants.js',
        'controllers.js',
        'services.js',
        'filters.js',
        'models.js',
        'providers.js',
        'components/sidebar/attachment/sidebar-attachment.component.js',
        'components/sidebar/attachment/sidebar-attachment.controller.js',
        'components/sidebar/attachment-button/sidebar-attachment-button.component.js',
        'controllers/list-items.controller.js',
        'directives/main.js',
        'directives/subheaders.js',
        'directives/lists.js',
        'directives/sidebar.js'
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
