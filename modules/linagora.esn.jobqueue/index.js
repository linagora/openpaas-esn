const glob = require('glob-all');

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const MODULE_NAME = 'jobqueue';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;

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
      const libModule = require('./backend/lib')(dependencies);

      return callback(null, {
        lib: libModule
      });
    },

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver/application')(this.lib, dependencies);
      const webserverWrapper = dependencies('webserver-wrapper');

      const frontendJsFilesFullPath = glob.sync([
        FRONTEND_JS_PATH + '**/*.module.js',
        FRONTEND_JS_PATH + '**/!(*spec).js'
      ]);

      const frontendJsFilesUri = frontendJsFilesFullPath.map(function(filepath) {
        return filepath.replace(FRONTEND_JS_PATH, '');
      });

      webserverWrapper.injectAngularAppModules(MODULE_NAME, frontendJsFilesUri, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: frontendJsFilesFullPath
      });

      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = jobQueueModule;
