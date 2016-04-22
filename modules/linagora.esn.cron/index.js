'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var cronModule = new AwesomeModule('linagora.esn.cron', {

  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      return callback(null, lib);
    },
    start: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      var logger = dependencies('logger');
      lib.reviveJobs(function(err) {
        if (err) {
          logger.error('Could not revive Cron Jobs', err);
        }
        callback();
      });
    }
  }
});
module.exports = cronModule;
