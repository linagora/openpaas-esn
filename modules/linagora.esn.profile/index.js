'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var profileModule = new AwesomeModule('linagora.esn.profile', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
  ],

  states: {
    lib: function(dependencies, callback) {
      var profilelib = require('./backend/lib')(dependencies);

      var lib = {
        lib: profilelib
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver')(dependencies, this);

      var webserverWrapper = dependencies('webserver-wrapper');

      var jsFiles = [
        'app.js'
      ];
      webserverWrapper.injectAngularModules('profile', jsFiles, ['linagora.esn.profile'], ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('profile', [lessFile], 'esn');
      webserverWrapper.addApp('profile', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = profileModule;
