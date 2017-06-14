'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');
const MODULE_NAME = 'contact.twitter';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const jsFiles = [
  'app.js',
  'constants.js',
  'twitterdisplayshell.js',
  'services.js',
  'directives.js'
];

const frontendFullPathModules = jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file));
const lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

const contactModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],
  states: {
    lib(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);

      var lib = {
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver/application')(dependencies);
      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, AWESOME_MODULE_NAME, ['esn'], { 
        localJsFiles: frontendFullPathModules
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start(dependencies, callback) {
      return callback();
    }
  }
});

contactModule.frontendInjections = {
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

module.exports = contactModule;
