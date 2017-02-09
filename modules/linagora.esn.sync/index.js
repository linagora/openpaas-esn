'use strict';

const path = require('path'),
      AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('linagora.esn.sync', {
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
      webserverWrapper.injectAngularAppModules('sync', [
        'app.js',
        'components/main/main.js',
        'components/controlcenter-menu-entry/controlcenter-menu-entry.js'
      ], ['linagora.esn.sync'], ['esn']);
      webserverWrapper.addApp('sync', app);

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});
