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
  shortName: 'dav',
  fullName: 'linagora.esn.davproxy',
  angularModules: []
};

moduleData.angularModules.push([moduleData.shortName, angularModuleFiles, moduleData.fullName, innerApps, modulesOptions]);

var davProxy = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.graceperiod', 'graceperiod'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.davserver', 'davserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      var addressbooks = require('./backend/webserver/addressbooks')(dependencies);
      var calendars = require('./backend/webserver/calendars')(dependencies);
      var json = require('./backend/webserver/json')(dependencies);

      var lib = {
        api: {
          addressbooks: addressbooks,
          calendars: calendars,
          json: json
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(dependencies);

      app.use('/api/addressbooks', this.api.addressbooks);
      app.use('/api/calendars', this.api.calendars);
      app.use('/api/json', this.api.json);

      moduleData.angularModules.forEach(mod => webserverWrapper.injectAngularModules.apply(webserverWrapper, mod));
      webserverWrapper.addApp(moduleData.shortName, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  },

  abilities: ['davproxy']
});

module.exports = davProxy;
