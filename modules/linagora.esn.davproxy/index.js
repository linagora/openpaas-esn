'use strict';

const resolve = require('path').resolve;

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const FRONTEND_PATH = resolve(__dirname, 'frontend');
const MODULE_NAME = 'dav';
const AWESOME_MODULE_NAME = 'linagora.esn.davproxy';
const libJS = [
  'app.js',
  'constants.js',
  'services.js'
];
const frontendFullPathModules = libJS.map(file => resolve(FRONTEND_PATH, 'js', file));

const davProxy = new AwesomeModule(AWESOME_MODULE_NAME, {
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

  states: {
    lib(dependencies, callback) {
      const addressbooks = require('./backend/webserver/addressbooks')(dependencies);
      const calendars = require('./backend/webserver/calendars')(dependencies);
      const json = require('./backend/webserver/json')(dependencies);

      const lib = {
        api: {
          addressbooks: addressbooks,
          calendars: calendars,
          json: json
        }
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const webserverWrapper = dependencies('webserver-wrapper');
      const app = require('./backend/webserver/application')(dependencies);

      app.use('/api/addressbooks', this.api.addressbooks);
      app.use('/api/calendars', this.api.calendars);
      app.use('/api/json', this.api.json);

      webserverWrapper.injectAngularModules(MODULE_NAME, libJS, AWESOME_MODULE_NAME, ['esn'], {
        localJsFiles: frontendFullPathModules
      });

      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      callback();
    }
  },

  abilities: ['davproxy']
});

davProxy.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      libJS,
      AWESOME_MODULE_NAME,
      ['esn'],
      { localJsFiles: frontendFullPathModules }
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
      moduleJS: libJS
    }
  ],
  views: [],
  i18n: []
};

module.exports = davProxy;
