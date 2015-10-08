'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var accountModule = new AwesomeModule('linagora.esn.account', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var accounts = require('./backend/webserver/api/accounts')(dependencies);

      var lib = {
        api: {
          accounts: accounts
        },
        lib: libModule
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/api', this.api.accounts);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('account', ['app.js', 'constants.js', 'controllers.js', 'directives.js', 'services.js', 'providers/twitter.js'], 'linagora.esn.account', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('account', [lessFile], 'esn');
      webserverWrapper.addApp('account', app);

      return callback();
    },

    start: function(dependencies, callback) {
      return callback();
    }
  }
});

module.exports = accountModule;
