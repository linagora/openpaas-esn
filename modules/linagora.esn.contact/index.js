'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const FRONTEND_PATH = path.join(__dirname, 'frontend');

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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.avatar', 'avatar'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.davserver', 'davserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.autoconf', 'autoconf', true)
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
      var app = require('./backend/webserver/application')(dependencies);

      app.use('/api/contacts', this.api.contacts);

      var webserverWrapper = dependencies('webserver-wrapper');
      var frontendModules = [
        'app.js',
        'constants.js',
        'controllers.js',
        'directives.js',
        'forms.js',
        'live.js',
        'services.js',
        'ui.js',
        'shells/contactshell.js',
        'shells/addressbookshell.js',
        'shells/contactdisplayshell.js',
        'shells/displayshellprovider.js',
        'shells/helpers.js',
        'shells/builders.js',
        'pagination.js',
        'contact-api-client.js',
        'providers/attendee.js',
        'providers/contact.js'
      ];

      webserverWrapper.injectAngularModules('contact', frontendModules, 'linagora.esn.contact', ['esn'], {
        localJsFiles: frontendModules.map(file => path.join(FRONTEND_PATH, 'js', file))
      });
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');

      webserverWrapper.injectLess('contact', [lessFile], 'esn');
      webserverWrapper.addApp('contact', app);

      require('./backend/webserver/api/contacts/avatarProvider').init(dependencies);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/contact').init(dependencies);

      dependencies('autoconf') && dependencies('autoconf').addTransformer(require('./backend/lib/autoconf')(dependencies));

      this.lib.start(callback);
    }
  }
});

contactModule.frontend = {
  angularModules: [
    [
      'contact', frontendModules, 'linagora.esn.contact', ['esn'], {
        localJsFiles: frontendModules.map(file => path.join(FRONTEND_PATH, 'js', file))
      }
    ]
  ],
  less: [
    [
      'contact', [lessFile], 'esn'
    ]
  ]
};

module.exports = contactModule;
