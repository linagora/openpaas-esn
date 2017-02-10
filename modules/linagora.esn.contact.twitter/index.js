'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var contactModule = new AwesomeModule('linagora.esn.contact.twitter', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
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
      webserverWrapper.injectAngularModules('contact.twitter', ['app.js', 'constants.js', 'twitterdisplayshell.js', 'services.js', 'directives.js'], 'linagora.esn.contact.twitter', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('contact.twitter', [lessFile], 'esn');
      webserverWrapper.addApp('contact.twitter', app);

      return callback();
    },

    start: function(dependencies, callback) {
      return callback();
    }
  }
});

module.exports = contactModule;
