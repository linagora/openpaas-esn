'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');

var accountModule = new AwesomeModule('linagora.esn.account', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'esn-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
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
      var app = require('./backend/webserver/application')(dependencies);

      app.use('/api', this.api.accounts);
      var libJS = [
        'app.js',
        'constants.js',
        'controllers.js',
        'directives.js',
        'services.js'
      ];

      var webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules('account', libJS, 'linagora.esn.account', ['esn'], {
        localJsFiles: libJS.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      });
      var lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

      webserverWrapper.injectLess('account', [lessFile], 'esn');
      webserverWrapper.addApp('account', app);

      return callback();
    },

    start: function(dependencies, callback) {
      return callback();
    }
  }
});

accountModule.frontend = {
  angularModules: [
    [
      'account', libJS, 'linagora.esn.account', ['esn'], {
        localJsFiles: libJS.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      }
    ]
  ],
  less: [
    [
      'account', [lessFile], 'esn'
    ]
  ]
};

module.exports = accountModule;
