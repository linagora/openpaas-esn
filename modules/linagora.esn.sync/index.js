'use strict';

const path = require('path'),
      AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

const moduleFiles = [
  'app.js',
  'components/main/main.js',
  'components/android/android.js',
  'components/controlcenter-menu-entry/controlcenter-menu-entry.js'
];
const FRONTEND_JS_PATH = `${__dirname}/frontend/app/`;

var signupEsnSync = new AwesomeModule('linagora.esn.sync', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: (dependencies, callback) => callback(),

    deploy: (dependencies, callback) => {
      const webserverWrapper = dependencies('webserver-wrapper'),
            app = require('./backend/webserver/application')(dependencies);

      webserverWrapper.injectLess('sync', [path.resolve(__dirname, 'frontend/app/styles.less')], 'esn');
      webserverWrapper.injectAngularAppModules('sync', moduleFiles, ['linagora.esn.sync'], ['esn'], {
        localJsFiles: moduleFiles.map(file => path.join(FRONTEND_JS_PATH, file))
      });
      webserverWrapper.addApp('sync', app);

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});

signupEsnSync.frontend = {
  angularAppModules: [
    [
      'sync', moduleFiles, ['linagora.esn.sync'], ['esn'], {
        localJsFiles: moduleFiles.map(file => path.join(FRONTEND_JS_PATH, file))
      }
    ]
  ],
  less: [
    [
      'sync', [path.resolve(__dirname, 'frontend/app/styles.less')], 'esn'
    ]
  ]
};

module.exports = signupEsnSync;