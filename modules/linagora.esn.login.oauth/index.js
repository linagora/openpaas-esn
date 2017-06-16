'use strict';

var AwesomeModule = require('awesome-module');
var path = require('path');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var MODULE_NAME = 'linagora.esn.login.oauth';
var APPLICATION_NAME = 'login-oauth';

var oauthLoginModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.domain', 'domain'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.oauth', 'oauth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.config', 'config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.filestore', 'store'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.denormalize.user', 'denormalizeUser')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./backend/lib')(dependencies);
      var api = require('./backend/webserver/api')(dependencies);

      return callback(null, {
        api: api,
        lib: lib
      });
    },

    deploy: function(dependencies, callback) {
      var config = dependencies('config')('default');
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(dependencies);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      var js = ['app.js'];

      app.use('/', this.api);

      if (config.auth && config.auth.oauth && config.auth.oauth.strategies && config.auth.oauth.strategies.length) {
        config.auth.oauth.strategies.forEach(function(strategy) {
          js.push('strategies/' + strategy + '.js');
        });
      }

      webserverWrapper.injectAngularModules(APPLICATION_NAME, js, MODULE_NAME, ['welcome']);
      webserverWrapper.injectLess(APPLICATION_NAME, [lessFile], 'welcome');
      webserverWrapper.addApp(APPLICATION_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.lib.start(callback);
    }
  }
});

oauthLoginModule.frontend = {
  angularModules: [
    [
      APPLICATION_NAME, js, MODULE_NAME, ['welcome']
    ]
  ],
  less: [
    [
      APPLICATION_NAME, [lessFile], 'welcome'
    ]
  ]
};

module.exports = oauthLoginModule;
