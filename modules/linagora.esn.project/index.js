'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var projectModule = new AwesomeModule('linagora.esn.project', {
  dependencies: [
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.collaboration', 'collaboration')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    }
  }
});

module.exports = projectModule;
