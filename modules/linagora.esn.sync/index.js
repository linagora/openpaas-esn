'use strict';

const path = require('path'),
      AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;
const innerApps = ['esn'];
const angularAppModuleFiles = [
  'app.js',
  'components/main/main.js',
  'components/android/android.js',
  'components/controlcenter-menu-entry/controlcenter-menu-entry.js'
];
const modulesOptions = {
  localJsFiles: angularAppModuleFiles.map(file => path.resolve(FRONTEND_JS_PATH, file))
};

const moduleData = {
  shortName: 'sync',
  fullName: 'linagora.esn.sync',
  lessFiles: [],
  angularAppModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_JS_PATH, 'styles.less')], innerApps]);
moduleData.angularAppModules.push([moduleData.shortName, angularAppModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

module.exports = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  data: moduleData,
  states: {
    lib: (dependencies, callback) => callback(),

    deploy: (dependencies, callback) => {
      const webserverWrapper = dependencies('webserver-wrapper'),
            app = require('./backend/webserver/application')(dependencies);

      moduleData.angularAppModules.forEach(mod => webserverWrapper.injectAngularAppModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});
