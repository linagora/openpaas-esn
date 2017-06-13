'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.resolve(__dirname, 'frontend');

var contactModule = new AwesomeModule('linagora.esn.contact.google', {
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

      const jsFiles = ['app.js', 'googledisplayshell.js', 'services.js', 'directives.js'];

      webserverWrapper.injectAngularModules('contact.google', jsFiles, 'linagora.esn.contact.google', ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      });
      var lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

      webserverWrapper.injectLess('contact.google', [lessFile], 'esn');
      webserverWrapper.addApp('contact.google', app);

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
      'contact.google', jsFiles, 'linagora.esn.contact.google', ['esn'], {
        localJsFiles: jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file))
      }
    ]
  ],
  less: [
    [
      'contact.google', [lessFile], 'esn'
    ]
  ]
};

module.exports = contactModule;
