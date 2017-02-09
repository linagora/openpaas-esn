'use strict';

const mockery = require('mockery');
const chai = require('chai');
const helpers = require('./helpers');
const path = require('path');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));

  const basePath = path.resolve(__dirname + '/..');

  this.testEnv = {
    basePath
  };
  this.helpers = {};
  helpers(this.helpers, this.testEnv);

});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  var depsStore = {
    logger: require('./fixtures/logger-noop'),
    errors: require('./fixtures/errors')
  };
  var dependencies = function(name) {
    return depsStore[name];
  };
  var addDep = function(name, dep) {
    depsStore[name] = dep;
  };

  this.moduleHelpers = {
    modulesPath: __dirname + '/../modules/',
    addDep: addDep,
    dependencies: dependencies
  };
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
