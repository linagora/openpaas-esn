'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');

var contactModule = new AwesomeModule('linagora.esn.contact.twitter', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
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
      var app = require('./backend/webserver/application')(dependencies);

      var webserverWrapper = dependencies('webserver-wrapper');

      const jsFiles = ['app.js', 'constants.js', 'twitterdisplayshell.js', 'services.js', 'directives.js'];

      webserverWrapper.injectAngularModules('contact.twitter', jsFiles, 'linagora.esn.contact.twitter', ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      });

      var lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

      webserverWrapper.injectLess('contact.twitter', [lessFile], 'esn');
      webserverWrapper.addApp('contact.twitter', app);

      return callback();
    },

    start: function(dependencies, callback) {
      return callback();
    }
  }
});

contactModule.frontend = {
  angularModules: [
    [
      'contact.twitter', jsFiles, 'linagora.esn.contact.twitter', ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      }
    ]
  ],
  less: [
    [
      'contact.twitter', [lessFile], 'esn'
    ]
  ]
};

module.exports = contactModule;
