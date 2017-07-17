'use strict';

const resolve = require('path').resolve;

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

const FRONTEND_PATH = resolve(__dirname, 'frontend');
const innerApps = ['esn'];
const angularModuleFiles = ['app.js', 'constants.js', 'services.js'];
const modulesOptions = {
  localJsFiles: angularModuleFiles.map(file => resolve(FRONTEND_PATH, 'js', file))
};

const moduleData = {
  shortName: 'import',
  fullName: 'linagora.esn.contact.import',
  lessFiles: [],
  angularModules: []
};

moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var importContactModule = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.config', 'config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.technical-user', 'technical-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.jobqueue', 'jobqueue'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.cron', 'cron')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var constantsModule = require('./backend/constants');

      return callback(null, {
        lib: libModule,
        constants: constantsModule
      });
    },

    deploy: function(dependencies, callback) {
      var webserver = require('./backend/webserver')(dependencies);
      var api = require('./backend/webserver/api')(dependencies, this.lib);
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = webserver.getRootApp();

      app.use('/api', api);

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularModules.apply(webserverWrapper, mod));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.lib.cron.init();
      require('./backend/ws/import').init(dependencies);
      callback();
    }
  }
});

module.exports = importContactModule;
