'use strict';

var AwesomeModule = require('awesome-module'),
    Dependency = AwesomeModule.AwesomeModuleDependency,
    path = require('path');

module.exports = new AwesomeModule('linagora.esn.signup.local', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.invitation', 'invitation'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n')
  ],

  states: {
    lib: (dependencies, callback) => callback(null, require('./backend/lib')(dependencies)),
    deploy: (dependencies, callback) => {
      var app = require('./backend/webserver')(dependencies, this),
        server = dependencies('webserver-wrapper'),
        jsFiles = [
          'app.js',
          'signup-form/signup-form.js',
          'signup-finalize/signup-finalize.js',
          'signup-confirm/signup-confirm.js'
        ],
        lessFile = path.resolve(__dirname, './frontend/app/styles.less');

      server.injectAngularAppModules('signup', jsFiles, ['linagora.esn.signup'], ['welcome']);
      server.injectLess('signup', [lessFile], 'welcome');
      server.addApp('signup', app);

      return callback();
    },
    start: (dependencies, callback) => callback()
  }
});
