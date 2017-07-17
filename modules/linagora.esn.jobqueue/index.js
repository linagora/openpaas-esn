'use strict';

const path = require('path');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const innerApps = ['esn'];
const angularModuleFiles = ['app.js', 'directives.js'];
const modulesOptions = {
  localJsFiles: angularModuleFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
};

const moduleData = {
  shortName: 'jobqueue',
  fullName: 'linagora.esn.jobqueue',
  angularModules: []
};

moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var jobQueueModule = new AwesomeModule('linagora.esn.jobqueue', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);

      return callback(null, {
        lib: libModule
      });
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this.lib, dependencies);
      var webserverWrapper = dependencies('webserver-wrapper');

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularModules.apply(webserverWrapper, mod));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = jobQueueModule;
