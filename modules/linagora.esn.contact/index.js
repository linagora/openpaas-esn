'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');

const FRONTEND_PATH = path.join(__dirname, 'frontend/app/');
const innerApps = ['esn'];
const angularModuleAppFiles = glob.sync([
  `${FRONTEND_PATH}**/*.module.js`,
  `${FRONTEND_PATH}**/!(*spec).js`
]);
const moduleData = {
  shortName: 'contact',
  fullName: 'linagora.esn.contact',
  lessFiles: []
};

moduleData.lessFiles.push([moduleData.shortName, [path.resolve(FRONTEND_PATH, 'app.less')], innerApps]);

const contactModule = new AwesomeModule(moduleData.fullName, {
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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.autoconf', 'autoconf', true),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.dav.import', 'dav.import')
  ],
  data: moduleData,
  states: {
    lib: function(dependencies, callback) {
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

    deploy: function(dependencies, callback) {
      const app = require('./backend/webserver/application')(dependencies);
      const webserverWrapper = dependencies('webserver-wrapper');

      app.use('/api/contacts', this.api.contacts);

      const appFilesUri = angularModuleAppFiles.map(function(filepath) {
        return filepath.replace(FRONTEND_PATH, '');
      });

      webserverWrapper.injectAngularAppModules(moduleData.shortName, appFilesUri, moduleData.fullName, innerApps, {
        localJsFiles: angularModuleAppFiles
      });

      moduleData.lessFiles.forEach(lessSet => webserverWrapper.injectLess.apply(webserverWrapper, lessSet));
      webserverWrapper.addApp(moduleData.shortName, app);

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

module.exports = contactModule;
