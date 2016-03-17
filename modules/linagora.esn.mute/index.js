'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var muteModule = new AwesomeModule('linagora.esn.mute', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      //var inbox = require('./backend/webserver/api/inbox/router')(dependencies);

      var lib = {
        api: {
          //inbox: inbox
        }
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/', this.api.inbox);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('mute', [
        'app.js',
        'constants.js',
        'controllers.js',
        'directives.js',
        'services.js'
      ], 'linagora.esn.mute', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('mute', [lessFile], 'esn');
      webserverWrapper.addApp('mute', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = muteModule;
