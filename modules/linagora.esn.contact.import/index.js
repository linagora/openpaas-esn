'use strict';

const resolve = require('path').resolve;

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const FRONTEND_PATH = resolve(__dirname, 'frontend');
const MODULE_NAME = 'import';
const AWESOME_MODULE_NAME = `linagora.esn.contact.${MODULE_NAME}`;
const jsFiles = [
  'app.js',
  'constants.js',
  'services.js'
];

const frontendFullPathModules = jsFiles.map(file => resolve(FRONTEND_PATH, 'js', file));

const importContactModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.config', 'config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.technical-user', 'technical-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.jobqueue', 'jobqueue'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.cron', 'cron')
  ],
  states: {
    lib(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);
      const constantsModule = require('./backend/constants');

      return callback(null, {
        lib: libModule,
        constants: constantsModule
      });
    },

    deploy(dependencies, callback) {
      const webserver = require('./backend/webserver')(dependencies);
      const api = require('./backend/webserver/api')(dependencies, this.lib);
      const app = webserver.getRootApp();

      app.use('/api', api);

      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, AWESOME_MODULE_NAME, ['esn'], {
        localJsFiles: frontendFullPathModules
      });
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      this.lib.cron.init();
      require('./backend/ws/import').init(dependencies);
      callback();
    }
  }
});

importContactModule.frontendInjections = {
  angularModules: [
    [
     MODULE_NAME,
     jsFiles,
     AWESOME_MODULE_NAME,
     ['esn'],
     { localJsFiles: frontendFullPathModules }
    ]
  ]
};

module.exports = importContactModule;
