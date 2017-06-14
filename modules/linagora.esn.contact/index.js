'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');

const FRONTEND_PATH = path.join(__dirname, 'frontend');

const MODULE_NAME = 'contact';
const AWESOME_MODULE_NAME = `linagora.esn.${MODULE_NAME}`;
const jsFiles = [
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

const frontendFullPathModules = jsFiles.map(file => path.resolve(FRONTEND_PATH, 'js', file));
const lessFile = path.resolve(FRONTEND_PATH, 'css/styles.less');

const contactModule = new AwesomeModule(AWESOME_MODULE_NAME, {
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
    lib(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);
      const contacts = require('./backend/webserver/api/contacts')(dependencies);

      const lib = {
        api: {
          contacts: contacts
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy(dependencies, callback) {
      const app = require('./backend/webserver/application')(dependencies);

      app.use('/api/contacts', this.api.contacts);

      const webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules(MODULE_NAME, jsFiles, AWESOME_MODULE_NAME, ['esn'], {
        localJsFiles: frontendFullPathModules
      });

      webserverWrapper.injectLess(MODULE_NAME, [lessFile], 'esn');
      webserverWrapper.addApp(MODULE_NAME, app);

      require('./backend/webserver/api/contacts/avatarProvider').init(dependencies);

      return callback();
    },

    start(dependencies, callback) {
      require('./backend/ws/contact').init(dependencies);

      dependencies('autoconf') && dependencies('autoconf').addTransformer(require('./backend/lib/autoconf')(dependencies));

      this.lib.start(callback);
    }
  }
});

contactModule.frontendInjections = {
  angularModules: [
    [
      MODULE_NAME,
      jsFiles,
      AWESOME_MODULE_NAME,
      ['esn'],
      { localJsFiles: frontendFullPathModules }
    ]
  ],
  less: [
    [
      MODULE_NAME, [lessFile], 'esn'
    ]
  ]
};

module.exports = contactModule;
