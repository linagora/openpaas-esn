'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');
const FRONTEND_JS_PATH = path.resolve(__dirname, 'frontend/js');
const MODULE_NAME = 'graceperiod';

const graceModule = new AwesomeModule('linagora.esn.graceperiod', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
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
      const frontendFilesFullPath = glob.sync([
        FRONTEND_JS_PATH + '**/!(*spec).js'
      ]);

      const frontendFiles = frontendFilesFullPath.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));

      webserverWrapper.injectAngularModules(MODULE_NAME, frontendFiles, 'linagora.esn.graceperiod', ['esn'], {
        localJsFiles: frontendFilesFullPath
      });
      const lessFile = path.resolve(__dirname, './frontend/css/styles.less');

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/graceperiod').init(this, dependencies);
      callback();
    }
  }
});

graceModule.frontend = {
  angularModules: [
    [
      MODULE_NAME, frontendFiles, 'linagora.esn.graceperiod', ['esn'], {
        localJsFiles: frontendFilesFullPath
      }
    ]
  ],
  less: [
    [
      MODULE_NAME, [lessFile], 'esn'
    ]
  ]
};

module.exports = graceModule;
