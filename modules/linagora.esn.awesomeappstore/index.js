'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var awesomeAppStore = new AwesomeModule('linagora.esn.awesomeappstore', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger')
  ],
  lib: function(dependencies, callback) {
    var logger = dependencies('logger');

    var api = {};
    return callback(null, api);
  }
});

module.exports.awesomeAppStore = awesomeAppStore;
