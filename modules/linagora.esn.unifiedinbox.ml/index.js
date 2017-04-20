'use strict';

const path = require('path'),
      AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const MODULE_JS_FILES = [
  'app.js',
  'app.run.js',
  'constants.js',
  'services/inbox-ml-config.js',
  'components/classification-message-indicator/classification-message-indicator.js',
  'components/classification-message-indicator/classification-message-indicator.controller.js',
  'components/classification-message-indicator/classification-message-indicator.run.js'
];
const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;

module.exports = new AwesomeModule('linagora.esn.unifiedinbox.ml', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.unifiedinbox', 'inbox')
  ],
  states: {
    lib: (dependencies, callback) => callback(),

    deploy: (dependencies, callback) => {
      const webserverWrapper = dependencies('webserver-wrapper'),
            app = require('./backend/webserver/application')(dependencies);

      webserverWrapper.injectLess('unifiedinbox.ml', [path.resolve(__dirname, './frontend/app/app.less')], 'esn');
      webserverWrapper.injectAngularAppModules('unifiedinbox.ml', MODULE_JS_FILES, ['linagora.esn.unifiedinbox.ml'], ['esn'], {
        localJsFiles: MODULE_JS_FILES.map(file => path.join(FRONTEND_JS_PATH, file))
      });
      webserverWrapper.addApp('unifiedinbox.ml', app);

      return callback();
    },

    start: (dependencies, callback) => {
      require('./backend/lib/config')(dependencies).register();

      callback();
    }
  }
});
