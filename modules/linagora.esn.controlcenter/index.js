'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var MODULE_NAME = 'controlcenter';
var AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;

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

      webserverWrapper.injectAngularModules(MODULE_NAME, [
        'app.js',
        'directives.js',
        'services.js',
        'controllers.js'
      ], [AWESOME_MODULE_NAME], ['esn']);

      webserverWrapper.injectAngularAppModules(MODULE_NAME, [
        'general/controlcenter-general.component.js',
        'general/controlcenter-general.controller.js',
        'general/controlcenter-general-subheader.component.js',
        'general/controlcenter-general.service.js'
      ], [AWESOME_MODULE_NAME], ['esn']);

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
