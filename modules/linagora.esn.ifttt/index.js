'use strict';

const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('linagora.esn.ifttt', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: (dependencies, callback) => callback(null, {}),

    deploy: (dependencies, callback) => {
      dependencies('webserver-wrapper').addApp('', require('./backend/webserver/application')(dependencies));

      return callback();
    },

    start: (dependencies, callback) => callback()
  }
});
