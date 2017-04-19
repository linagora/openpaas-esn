'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var MODULE_NAME = 'controlcenter';
var AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;
const moduleFiles = [
  'general/controlcenter-general.component.js',
  'general/controlcenter-general.controller.js',
  'general/controlcenter-general-subheader.component.js',
  'general/controlcenter-general.service.js'
];
const jsFiles = [
  'app.js',
  'directives.js',
  'services.js',
  'controllers.js'
];
const FRONTEND_JS_PATH = `${__dirname}/frontend/js/`;
const FRONTEND_APP_PATH = `${__dirname}/frontend/app/`;

var controlCenterModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
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
      var app = require('./backend/webserver')(dependencies, this);
      var webserverWrapper = dependencies('webserver-wrapper');
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: jsFiles.map(file => path.join(FRONTEND_JS_PATH, file))
      });

      webserverWrapper.injectAngularAppModules(MODULE_NAME, moduleFiles, [AWESOME_MODULE_NAME], ['esn'], {
        localJsFiles: moduleFiles.map(file => path.join(FRONTEND_APP_PATH, file))
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = controlCenterModule;
