'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');

const NAME = 'user-status';
const MODULE_NAME = `linagora.esn.${NAME}`;
const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;

const APP_ENTRY_POINT = `${FRONTEND_JS_PATH}app.js`;

const lessFile = path.resolve(__dirname, './frontend/app/user-status.styles.less');
const frontendFullPathModules = glob.sync([
  APP_ENTRY_POINT,
  FRONTEND_JS_PATH + '**/!(*spec).js'
]);
const frontendUriPathModules = frontendFullPathModules.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));
const frontendViewFullPathModules = glob.sync([
  FRONTEND_JS_PATH + '**/*.jade'
]);
const viewsFiles = frontendViewFullPathModules.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));

const userStatusModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.cron', 'cron')
  ],
  states: {
    lib(dependencies, callback) {
      const lib = require('./backend/lib')(dependencies);
      const api = require('./backend/webserver/api')(dependencies, lib);

      callback(null, {api, lib});
    },

    deploy(dependencies, callback) {
      const webserverWrapper = dependencies('webserver-wrapper');
      const app = require('./backend/webserver/application')(dependencies);

      app.use('/api', this.api);
      webserverWrapper.injectAngularAppModules(NAME, frontendUriPathModules, MODULE_NAME, ['esn'], {
        localJsFiles: frontendFullPathModules
      });
      webserverWrapper.injectLess(NAME, [lessFile], 'esn');
      webserverWrapper.addApp(NAME, app);

      callback();
    },

    start(dependencies, callback) {
      require('./backend/websocket').init(dependencies, this.lib);
      this.lib.start(callback);
    }
  }
});

userStatusModule.frontendInjections = {
  angularAppModules: [
    [
      NAME,
      frontendUriPathModules,
      [MODULE_NAME],
      ['esn'],
      { localJsFiles: frontendFullPathModules }
    ]
  ],
  less: [
    [NAME, [lessFile], 'esn']
  ],
  js: [
    {
      moduleName: NAME,
      path: {
        base: 'frontend/app',
        serve: `${NAME}/app`
      },
      moduleJS: frontendUriPathModules
    }
  ],
  views: [
    {
      moduleName: NAME,
      path: {
        base: 'frontend/app',
        serve: `${NAME}/app`
      },
      moduleViews: viewsFiles
    }
  ],
  i18n: [
    'backend/lib/i18n/locales/fr.json',
    'backend/lib/i18n/locales/en.json',
    'backend/lib/i18n/locales/vi.json'
  ]
};

module.exports = userStatusModule;
