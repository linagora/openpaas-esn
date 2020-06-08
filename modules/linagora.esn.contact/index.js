'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');

const FRONTEND_JS_PATH = path.join(__dirname, 'frontend/app/');
const FRONTEND_JS_PATH_BUILD = path.join(__dirname, 'dist/');
const innerApps = ['esn'];
const moduleData = {
  shortName: 'contact',
  fullName: 'linagora.esn.contact',
  lessFiles: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_JS_PATH, 'app.less')], innerApps]);

const contactModule = new AwesomeModule(moduleData.fullName, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.messaging', 'messaging'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.elasticsearch', 'elasticsearch'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.platformadmins', 'platformAdminsMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.domain', 'domainMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.module', 'moduleMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.domain', 'domain'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.technical-user', 'technical-user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.avatar', 'avatar'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.davserver', 'davserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.people', 'people'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.jobqueue', 'jobqueue'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.autoconf', 'autoconf', true),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.dav.import', 'dav.import', true)
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);
      const contacts = require('./backend/webserver/api/contacts')(dependencies);
      const addressbooks = require('./backend/webserver/api/addressbooks/domain-members')(dependencies);

      const lib = {
        api: {
          contacts,
          addressbooks
        },
        lib: libModule
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver/application')(dependencies);
      const webserverWrapper = dependencies('webserver-wrapper');

      let frontendJsFilesFullPath, frontendJsFilesUri;

      if (process.env.NODE_ENV !== 'production') {
        frontendJsFilesFullPath = glob.sync([
          FRONTEND_JS_PATH + '**/*.module.js',
          FRONTEND_JS_PATH + '**/!(*spec).js'
        ]);

        frontendJsFilesUri = frontendJsFilesFullPath.map(filepath => filepath.replace(FRONTEND_JS_PATH, ''));
      } else {
        frontendJsFilesFullPath = glob.sync([
          FRONTEND_JS_PATH_BUILD + '*.js'
        ]);

        frontendJsFilesUri = frontendJsFilesFullPath.map(filepath => filepath.replace(FRONTEND_JS_PATH_BUILD, ''));
      }

      webserverWrapper.injectAngularAppModules(moduleData.shortName, frontendJsFilesUri, moduleData.fullName, innerApps, {
        localJsFiles: frontendJsFilesFullPath
      });

      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

      require('./backend/webserver/api/contacts/avatarProvider').init(dependencies);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./backend/ws/contact').init(dependencies);
      require('./backend/lib/config')(dependencies).register();

      dependencies('autoconf') && dependencies('autoconf').addTransformer(require('./backend/lib/autoconf')(dependencies));

      this.lib.start(callback);
    }
  }
});

module.exports = contactModule;
