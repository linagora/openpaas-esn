'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var importContactModule = new AwesomeModule('linagora.esn.contact.import.twitter', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact.import', 'contact-import'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      return callback(null, {lib: libModule});
    },

    deploy: function(dependencies, callback) {
      var frontendModules = [
        'app.js',
        'constants.js',
        'services.js',
        'directives.js'
      ];

      dependencies('contact-import').lib.addImporter({
        ns: 'contact.import.twitter',
        name: 'twitter',
        lib: this.lib,
        frontend: {
          staticPath: path.normalize(__dirname + '/frontend'),
          modules: frontendModules,
          moduleName: 'linagora.esn.contact.import.twitter'
        }
      });

      callback();
    },

    start: function(dependencies, callback) {
      dependencies('logger').info('Starting the Twitter contact importer');
      callback();
    }
  }
});

module.exports = importContactModule;
