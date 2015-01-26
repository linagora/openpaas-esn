'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var awesomeAppStore = new AwesomeModule('linagora.esn.awesomeappstore', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.filestore', 'filestore'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.community', 'community'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.injection', 'injection'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var moduleManager = require('../../backend/module-manager');
      var schemas = dependencies('db').mongo.schemas;

      require('./backend/db/mongo/application')(schemas);

      var AwesomeAppManager = require('./backend/appstore-manager').AwesomeAppManager;
      var appManager = new AwesomeAppManager(dependencies, moduleManager);
      require('./backend/injection/pubsub').init(dependencies);

      var app = require('./backend/webserver/application')(appManager, dependencies);

      return callback(null, {
        app: app,
        manager: appManager
      });
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('appstore', ['appstore.js', 'controllers.js', 'directives.js', 'services.js'], 'esn.appstore', ['esn']);
      webserverWrapper.injectCSS('appstore', 'styles.css', 'esn');
      webserverWrapper.addApp('appstore', this.app);
      return callback();
    }
  }
});

module.exports = awesomeAppStore;
