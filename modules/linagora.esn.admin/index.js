'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var MODULE_NAME = 'admin';
var AWESOME_MODULE_NAME = 'linagora.esn.' + MODULE_NAME;

var adminModule = new AwesomeModule(AWESOME_MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.domain-config', 'domain-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.domain', 'domainMiddleware'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],

  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var configuration = require('./backend/webserver/api/configuration')(dependencies);

      var lib = {
        api: {
          configuration: configuration
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/', this.api.configuration);

      var webserverWrapper = dependencies('webserver-wrapper');
      var frontendJsFiles = [
        'app.js',
        'app.routes.js',
        'directives.js',
        'services.js',
        'controllers.js',
        'subheader/admin-subheader-save-button.component.js',
        'sidebar/admin-sidebar.component.js',
        'dav/admin-dav.component.js',
        'dav/admin-dav.controller.js',
        'dav/admin-dav-subheader.component.js',
        'ldap/admin-ldap.component.js',
        'ldap/admin-ldap.controller.js',
        'ldap/admin-ldap-subheader.component.js'
      ];

      webserverWrapper.injectAngularModules(MODULE_NAME, frontendJsFiles, [AWESOME_MODULE_NAME], ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = adminModule;
