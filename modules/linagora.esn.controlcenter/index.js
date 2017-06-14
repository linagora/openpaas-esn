const AwesomeModule = require('awesome-module');
const path = require('path');
const glob = require('glob-all');

const Dependency = AwesomeModule.AwesomeModuleDependency;
const MODULE_NAME = 'controlcenter';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const FRONTEND_APP_PATH = `${__dirname}/frontend/app/`;

const lessFile = path.join(FRONTEND_APP_PATH, 'app.less');
const frontendJsFilesFullPath = glob.sync([
  FRONTEND_APP_PATH + '**/*.module.js',
  FRONTEND_APP_PATH + '**/!(*spec).js'
]);
const frontendJsFilesUri = frontendJsFilesFullPath.map(filepath => filepath.replace(FRONTEND_APP_PATH, ''));

const controlCenterModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],

  states: {
    lib(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);

      const lib = {
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver')(dependencies, this);
      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularAppModules(MODULE_NAME, frontendJsFilesUri, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: frontendJsFilesFullPath
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      callback();
    }
  }
});

controlCenterModule.frontendInjections = {
  angularAppModules: [
    [
      MODULE_NAME,
      frontendJsFilesUri,
      [AWESOME_MODULE_NAME],
      ['esn'],
      { localJsFiles: frontendJsFilesFullPath }
    ]
  ],
  less: [
    [MODULE_NAME, [lessFile], 'esn']
  ]
};

module.exports = controlCenterModule;
