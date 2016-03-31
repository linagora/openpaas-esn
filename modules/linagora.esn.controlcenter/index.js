'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var controlCenterModule = new AwesomeModule('linagora.esn.controlcenter', {
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
        'app.js'
      ];

      webserverWrapper.injectAngularModules('controlcenter', jsFiles, ['linagora.esn.controlcenter'], ['esn']);
      webserverWrapper.injectLess('controlcenter', [lessFile], 'esn');
      webserverWrapper.addApp('controlcenter', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = controlCenterModule;
