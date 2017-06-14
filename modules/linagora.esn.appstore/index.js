'use strict';

const moduleManager = require('../../backend/module-manager');
const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const FRONTEND_PATH = path.join(__dirname, 'frontend');

const MODULE_NAME = 'appstore';
const AWESOME_MODULE_NAME = `esn.${MODULE_NAME}`;
const jsFiles = [
  'appstore.js',
  'controllers.js',
  'directives.js',
  'services.js'
];

const frontendFullPathModules = jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file));
const lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

var awesomeAppStore = new AwesomeModule('linagora.esn.awesomeappstore', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.filestore', 'filestore'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.domain', 'domain'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.community', 'community'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.injection', 'injection'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib(dependencies, callback) {
      var schemas = dependencies('db').mongo.schemas;

      require('./backend/db/mongo/application')(schemas);

      const AwesomeAppManager = require('./backend/appstore-manager').AwesomeAppManager;
      const appManager = new AwesomeAppManager(dependencies, moduleManager);

      require('./backend/injection/pubsub').init(dependencies);

      const app = require('./backend/webserver/application')(appManager, dependencies);

      return callback(null, {
        app: app,
        manager: appManager
      });
    },

    deploy(dependencies, callback) {
      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, AWESOME_MODULE_NAME, ['esn'], { 
        localJsFiles: frontendFullPathModules
      });
      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, this.app);

      return callback();
    },

    start(dependencies, callback) {
      const esnconfig = dependencies('esn-config');
      const logger = dependencies('logger');

      function startEsnModules() {
        esnconfig('injection').get('modules', function(err, modules) {
          if (err) {
            return callback(err);
          }

          if (!modules) {
            return callback(null);
          }

          moduleManager.manager.fire('start', modules).then(function() {
            callback(null);
          }, function(err) {
            // Do not fail if a module is not found.
            logger.error(err.message);
            callback(null);
          });
        });
      }

      startEsnModules();
    }
  }
});

awesomeAppStore.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      jsFiles,
      AWESOME_MODULE_NAME,
      ['esn'],
      { localJsFiles: frontendFullPathModules }
    ]
  ],
  less: [
    [
      MODULE_NAME, [lessFile], 'esn'
    ]
  ]
};

module.exports = awesomeAppStore;
