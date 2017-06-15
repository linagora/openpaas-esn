'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const FRONTEND_VIEW_PATH = `${__dirname}/frontend/views/`;
const lessFiles = [path.resolve(FRONTEND_PATH, 'css/styles.less')];
const libJS = [
  'app.js',
  'constants.js',
  'controllers.js',
  'directives.js',
  'services.js'
];
const MODULE_NAME = 'account';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const innerApps = ['esn'];
const modulesOptions = {
  localJsFiles: libJS.map(file => path.resolve(FRONTEND_PATH, 'js', file))
};
const frontendViewFullPathModules = glob.sync([
  FRONTEND_VIEW_PATH + '**/*.jade'
]);
const viewsFiles = frontendViewFullPathModules.map(filepath => filepath.replace(FRONTEND_VIEW_PATH, ''));

const accountModule = new AwesomeModule('linagora.esn.account', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'esn-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);
      const accounts = require('./backend/webserver/api/accounts')(dependencies);

      const lib = {
        api: {
          accounts: accounts
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver/application')(dependencies);

      app.use('/api', this.api.accounts);

      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, libJS, AWESOME_MODULE_NAME, ['esn'], modulesOptions);

      webserverWrapper.injectLess(MODULE_NAME, lessFiles, 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      return callback();
    }
  }
});

accountModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      libJS,
      AWESOME_MODULE_NAME,
      ['esn'],
      modulesOptions
    ]
  ],
  less: [
    [MODULE_NAME, lessFiles, innerApps]
  ],
  js: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/js',
        serve: `${MODULE_NAME}/js`
      },
      moduleJS: libJS
    }
  ],
  views: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/views',
        serve: `${MODULE_NAME}/views`
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

module.exports = accountModule;
