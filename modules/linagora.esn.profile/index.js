'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');

var profileModule = new AwesomeModule('linagora.esn.profile', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
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
        'app.js',
        'controllers.js',
        'services.js',
        'directives.js'
      ];

      webserverWrapper.injectAngularModules('profile', jsFiles, ['linagora.esn.profile'], ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      });
      var lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

      webserverWrapper.injectLess('profile', [lessFile], 'esn');
      webserverWrapper.addApp('profile', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

profileModule.frontend = {
  angularModules: [
    [
      'profile', jsFiles, ['linagora.esn.profile'], ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      }
    ]
  ],
  less: [
    [
      'profile', [lessFile], 'esn'
    ]
  ]
};

module.exports = profileModule;
