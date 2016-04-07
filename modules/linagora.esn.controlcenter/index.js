'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var MODULE_NAME = 'controlcenter';
var AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;

var controlCenterModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
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
      var jsFiles = [
        'app.js',
        'directives.js',
        'services.js',
        'controllers.js'
      ];

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, [AWESOME_MODULE_NAME], ['esn']);
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
