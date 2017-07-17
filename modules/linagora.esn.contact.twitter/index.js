'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const innerApps = ['esn'];
const angularModuleFiles = ['app.js', 'constants.js', 'twitterdisplayshell.js', 'services.js', 'directives.js'];
const modulesOptions = {
  localJsFiles: angularModuleFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
};

const moduleData = {
  shortName: 'contact.twitter',
  fullName: 'linagora.esn.contact.twitter',
  lessFiles: [],
  angularModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_PATH, 'css/styles.less')], innerApps]);
moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var contactModule = new AwesomeModule('linagora.esn.contact.twitter', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);

      var lib = {
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies);
      var webserverWrapper = dependencies('webserver-wrapper');

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularModules.apply(webserverWrapper, mod));
      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      return callback();
    }
  }
});

module.exports = contactModule;
