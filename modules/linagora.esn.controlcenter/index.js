const AwesomeModule = require('awesome-module');
const path = require('path');
const glob = require('glob-all');

const Dependency = AwesomeModule.AwesomeModuleDependency;
const MODULE_NAME = 'controlcenter';
const AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;
const FRONTEND_JS_PATH = `${__dirname}/frontend/js/`;
const FRONTEND_APP_PATH = `${__dirname}/frontend/app/`;
const jsFiles = [
  'app.js',
  'directives.js',
  'services.js',
  'controllers.js'
];

const controlCenterModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],

  states: {
    lib: function(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);

      const lib = {
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver')(dependencies, this);
      const webserverWrapper = dependencies('webserver-wrapper');
      const lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      const frontendJsFilesFullPath = glob.sync([
        FRONTEND_APP_PATH + '**/*.module.js',
        FRONTEND_APP_PATH + '**/!(*spec).js'
      ]);
      const frontendJsFilesUri = frontendJsFilesFullPath.map(filepath => filepath.replace(FRONTEND_APP_PATH, ''));

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: jsFiles.map(file => path.join(FRONTEND_JS_PATH, file))
      });

      webserverWrapper.injectAngularAppModules(MODULE_NAME, frontendJsFilesUri, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: frontendJsFilesFullPath
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = controlCenterModule;
