'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');
const glob = require('glob-all');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend/');
const FRONTEND_JS_PATH_BUILD = __dirname + '/dist/';
const innerApps = ['esn'];

let angularModuleFiles, modulesOptions;

if (process.env.NODE_ENV !== 'production') {
  angularModuleFiles = glob.sync([
    FRONTEND_PATH + 'js/app.js',
    FRONTEND_PATH + '**/!(*spec).js'
  ]);

  modulesOptions = {
    localJsFiles: angularModuleFiles.map(file => path.resolve(FRONTEND_PATH, file))
  };
} else {
  angularModuleFiles = glob.sync([
    FRONTEND_JS_PATH_BUILD + '*.js'
  ]);

  modulesOptions = {
    localJsFiles: angularModuleFiles.map(file => path.resolve(FRONTEND_JS_PATH_BUILD, file))
  };
}
const moduleData = {
  shortName: 'account',
  fullName: 'linagora.esn.account',
  lessFiles: [],
  angularModules: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_PATH, 'css/styles.less')], innerApps]);
moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var accountModule = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'esn-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var accounts = require('./backend/webserver/api/accounts')(dependencies);

      var lib = {
        api: {
          accounts: accounts
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies);
      var webserverWrapper = dependencies('webserver-wrapper');

      app.use('/api', this.api.accounts);
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

module.exports = accountModule;
