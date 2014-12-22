'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var messagingMail = new AwesomeModule('linagora.esn.messaging.email', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.message', 'message'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user')
  ],
  states: {
    lib: function(dependencies, callback) {

      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    },
    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(this, dependencies);
      webserverWrapper.addApp('', app);
      return callback();
    }
  }
});
module.exports = messagingMail;
