'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var contactModule = new AwesomeModule('linagora.esn.contact', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.elasticsearch', 'elasticsearch'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.avatar', 'avatar'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.davserver', 'davserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var contacts = require('./backend/webserver/api/contacts')(dependencies);

      var lib = {
        api: {
          contacts: contacts
        },
        lib: libModule
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/api/contacts', this.api.contacts);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('contact', ['app.js', 'constants.js', 'controllers.js', 'directives.js', 'services.js'], 'linagora.esn.contact', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('contact', [lessFile], 'esn');
      webserverWrapper.addApp('contact', app);

      require('./backend/webserver/api/contacts/avatarProvider').init(dependencies);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/contact').init(dependencies);
      this.lib.start(callback);
    }
  }
});

module.exports = contactModule;
