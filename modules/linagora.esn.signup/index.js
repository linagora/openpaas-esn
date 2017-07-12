'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const FRONTEND_JS_PATH = path.resolve(FRONTEND_PATH, 'app');

const innerApps = ['welcome'];
const angularAppModuleFiles = [
  'app.js',
  'signup-form/signup-form.js',
  'signup-confirm/signup-confirm.js',
  'signup-finalize-form/signup-finalize-form.js'
];
const modulesOptions = {
  localJsFiles: angularAppModuleFiles.map(file => path.resolve(FRONTEND_JS_PATH, file))
};

const moduleData = {
  shortName: 'signup',
  fullName: 'linagora.esn.signup',
  lessFiles: [],
  angularAppModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_JS_PATH, 'styles.less')], innerApps]);
moduleData.angularAppModules.push([moduleData.shortName, angularAppModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

module.exports = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.invitation', 'invitation'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],
  data: moduleData,
  states: {
    lib: (dependencies, callback) => callback(null, require('./backend/lib')(dependencies)),
    deploy: (dependencies, callback) => {
      var app = require('./backend/webserver')(dependencies, this),
        webserverWrapper = dependencies('webserver-wrapper');

      moduleData.angularAppModules.forEach(mod => webserverWrapper.injectAngularAppModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});
