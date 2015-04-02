'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var cronModule = new AwesomeModule('linagora.esn.cron', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    }
  }
});
module.exports = cronModule;
