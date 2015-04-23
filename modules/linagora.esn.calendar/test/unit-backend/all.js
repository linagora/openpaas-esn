'use strict';

beforeEach(function() {
  var depsStore = {
    logger: require('../fixtures/logger-noop'),
    errors: require('../fixtures/errors')
  };
  var dependencies = function(name) {
    return depsStore[name];
  };
  var addDep = function(name, dep) {
    depsStore[name] = dep;
  };
  this.moduleHelpers = {
    backendPath: __dirname + '/../../backend',
    addDep: addDep,
    dependencies: dependencies
  };
});
