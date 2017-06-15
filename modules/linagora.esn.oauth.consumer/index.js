'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const MODULE_NAME = 'oauth';
const MODULE_FUL_NAME = `linagora.esn.${MODULE_NAME}`;

const oauthModule = new AwesomeModule('linagora.esn.oauth.consumer', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.oauth', 'oauth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var oauth = require('./backend/webserver/api/oauth')(dependencies);

      var lib = {
        api: {
          oauth: oauth
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies);

      app.use('/', this.api.oauth);

      var webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, ['app.js', 'services.js'], MODULE_FUL_NAME, ['esn']);
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.lib.start(callback);
    }
  }
});

oauthModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME, ['app.js', 'services.js'], MODULE_FUL_NAME, ['esn']
    ]
  ],
  less: [],
  js: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/js',
        serve: `${MODULE_NAME}/js`
      },
      moduleJS: ['app.js', 'services.js']
    }
  ],
  views: [],
  i18n: [
    'backend/lib/i18n/locales/fr.json',
    'backend/lib/i18n/locales/en.json',
    'backend/lib/i18n/locales/vi.json'
  ]
};

module.exports = oauthModule;
