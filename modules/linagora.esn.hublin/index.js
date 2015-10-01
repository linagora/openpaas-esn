'use strict';

var moduleManager = require('../../backend/module-manager');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var awesomeHublin = new AwesomeModule('linagora.esn.hublin', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
  ],
  states: {

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies);
      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('hublin',['awesomehublin.js'], 'esn.awesomeHublin', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
//      webserverWrapper.injectLess('hublin', [lessFile], 'esn');
      webserverWrapper.addApp('hublin', app);
      return callback();
    }

  }
});

module.exports = awesomeHublin;
