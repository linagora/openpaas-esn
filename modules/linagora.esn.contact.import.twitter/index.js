const AwesomeModule = require('awesome-module');
const Dependency = AwesomeModule.AwesomeModuleDependency;
const path = require('path');
const glob = require('glob-all');
const FRONTEND_JS_PATH = __dirname + '/frontend/js/';

var importContactModule = new AwesomeModule('linagora.esn.contact.import.twitter', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact', 'contact'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.contact.import', 'contact-import'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.jobqueue', 'jobqueue'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub')
  ],
  states: {
    lib: function(dependencies, callback) {
      const libModule = require('./backend/lib')(dependencies);

      return callback(null, {lib: libModule});
    },

    deploy: function(dependencies, callback) {
      const frontendJsFileFullPaths = glob.sync([
        FRONTEND_JS_PATH + '*.js'
      ]);

      const frontendJsFileURIs = frontendJsFileFullPaths.map(function(filepath) {
        return filepath.replace(FRONTEND_JS_PATH, '');
      });

      dependencies('contact-import').lib.addImporter({
        ns: 'contact.import.twitter',
        name: 'twitter',
        lib: this.lib,
        frontend: {
          staticPath: path.normalize(__dirname + '/frontend'),
          jsFileFullPaths: frontendJsFileFullPaths,
          jsFileURIs: frontendJsFileURIs,
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
