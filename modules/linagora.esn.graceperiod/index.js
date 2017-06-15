'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');
const FRONTEND_JS_PATH = path.resolve(__dirname, 'frontend/js');
const MODULE_NAME = 'graceperiod';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const frontendFilesFullPath = glob.sync([
  FRONTEND_JS_PATH + '**/!(*spec).js'
]);

const frontendFiles = frontendFilesFullPath.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));
const lessFile = path.resolve(__dirname, './frontend/css/styles.less');

const graceModule = new AwesomeModule('linagora.esn.graceperiod', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
  states: {
    lib(dependencies, callback) {
      const lib = require('./lib')(dependencies);

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver/application')();
      const api = require('./backend/webserver/api')(this, dependencies);

      app.use('/api', api);

      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, frontendFiles, AWESOME_MODULE_NAME, ['esn'], {
        localJsFiles: frontendFilesFullPath
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      require('./backend/ws/graceperiod').init(this, dependencies);
      callback();
    }
  }
});

graceModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      frontendFiles,
      AWESOME_MODULE_NAME,
      ['esn'],
      { localJsFiles: frontendFilesFullPath }
    ]
  ],
  less: [
    [
      MODULE_NAME, [lessFile], 'esn'
    ]
  ],
  js: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/js',
        serve: `${MODULE_NAME}/js`
      },
      moduleJS: frontendFiles
    }
  ],
  views: [],
  i18n: []
};

module.exports = graceModule;
