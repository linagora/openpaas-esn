'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');
const glob = require('glob-all');

const FRONTEND_JS_PATH = __dirname + '/frontend/app/';
const innerApps = ['esn'];
const localJsFiles = glob.sync([
  FRONTEND_JS_PATH + '**/*.module.js',
  FRONTEND_JS_PATH + '**/!(*spec).js'
]);

const angularModuleFiles = localJsFiles.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));
const modulesOptions = {
  localJsFiles
};

const moduleData = {
  shortName: 'profile',
  fullName: 'linagora.esn.profile',
  lessFiles: [],
  angularModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_JS_PATH, 'app.less')], innerApps]);
moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var profileModule = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      var profilelib = require('./backend/lib')(dependencies);

      var lib = {
        lib: profilelib
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver')(dependencies, this);
      var webserverWrapper = dependencies('webserver-wrapper');

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularAppModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = profileModule;
