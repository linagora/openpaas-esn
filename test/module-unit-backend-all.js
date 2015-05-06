'use strict';

var mockery = require('mockery'),
  chai = require('chai'),
  helpers = require('./helpers');

before(function() {
  chai.use(require('chai-shallow-deep-equal'));
  chai.use(require('sinon-chai'));
  chai.use(require('chai-as-promised'));
  this.testEnv = {};
  this.helpers = {};
  helpers(this.helpers, this.testEnv);
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
