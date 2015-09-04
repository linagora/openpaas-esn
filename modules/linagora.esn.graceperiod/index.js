'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var graceModule = new AwesomeModule('linagora.esn.graceperiod', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')();
      var api = require('./backend/webserver/api')(this, dependencies);
      app.use('/api', api);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('graceperiod', ['app.js', 'constants.js', 'services.js', 'directives.js'], 'linagora.esn.graceperiod', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('graceperiod', [lessFile], 'esn');
      webserverWrapper.addApp('graceperiod', app);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/graceperiod').init(this, dependencies);
      callback();
    }
  }
});
module.exports = graceModule;
