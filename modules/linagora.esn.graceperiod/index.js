'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');
const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const FRONTEND_JS_PATH = path.resolve(FRONTEND_PATH, 'js');
const innerApps = ['esn'];
const angularModuleFilesFullPath = glob.sync([
  FRONTEND_JS_PATH + '**/!(*spec).js'
]);
const angularModuleFiles = angularModuleFilesFullPath.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));
const modulesOptions = {
  localJsFiles: angularModuleFilesFullPath
};

const moduleData = {
  shortName: 'graceperiod',
  fullName: 'linagora.esn.graceperiod',
  lessFiles: [],
  angularModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_PATH, 'css/styles.less')], innerApps]);
moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

const graceModule = new AwesomeModule(moduleData.fullName, {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      const lib = require('./lib')(dependencies);

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver/application')();
      const api = require('./backend/webserver/api')(this, dependencies);

      app.use('/api', api);

      const webserverWrapper = dependencies('webserver-wrapper');

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/graceperiod').init(this, dependencies);
      callback();
    }
  }
});

module.exports = graceModule;
