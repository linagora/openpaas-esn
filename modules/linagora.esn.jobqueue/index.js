'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const MODULE_NAME = 'jobqueue';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;

const jsFiles = ['app.js', 'directives.js'];
const frontendFiles = jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file));

const jobQueueModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);

      return callback(null, {
        lib: libModule
      });
    },

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver/application')(this.lib, dependencies);
      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, AWESOME_MODULE_NAME, ['esn'], { localJsFiles: frontendFiles });
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

jobQueueModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      jsFiles,
      AWESOME_MODULE_NAME,
      ['esn'],
      { localJsFiles: frontendFiles }
    ]
  ],
  less: [],
  js: [
    {
      moduleName: MODULE_NAME,
      path: {
        base: 'frontend/js',
        serve: `${MODULE_NAME}/js`
      },
      moduleJS: jsFiles
    }
  ],
  views: [],
  i18n: []
};

module.exports = jobQueueModule;
