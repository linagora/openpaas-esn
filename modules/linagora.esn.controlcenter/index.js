const AwesomeModule = require('awesome-module');
const path = require('path');
const glob = require('glob-all');

const Dependency = AwesomeModule.AwesomeModuleDependency;
const MODULE_NAME = 'controlcenter';
const AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;
const FRONTEND_APP_PATH = `${__dirname}/frontend/app/`;
const innerApps = ['esn'];
const angularModuleAppFiles = glob.sync([
  FRONTEND_APP_PATH + '**/*.module.js',
  FRONTEND_APP_PATH + '**/!(*spec).js'
]);
const modulesOptions = {
  localJsFiles: angularModuleAppFiles
};

const moduleData = {
  shortName: MODULE_NAME,
  fullName: AWESOME_MODULE_NAME,
  lessFiles: [],
  angularAppModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.join(FRONTEND_APP_PATH, 'app.less')], innerApps]);
moduleData.angularAppModules.push([
  moduleData.shortName,
  angularModuleAppFiles.map(filepath => filepath.replace(FRONTEND_APP_PATH, '')),
  moduleData.fullName,
  innerApps,
  modulesOptions
]);

const controlCenterModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],
  data: moduleData,
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

      moduleData.angularAppModules.forEach(mod => webserverWrapper.injectAngularAppModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = controlCenterModule;
