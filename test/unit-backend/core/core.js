'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var BASEPATH = '../../..';

describe('The Core module', function() {

  beforeEach(function() {
    mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  });

  it('should contains a config property', function() {
    var core = require(BASEPATH + '/backend/core');
    expect(core.config).to.exist;
    expect(core.config).to.be.a.function;
  });

  it('should contains a logger property', function() {
    var core = require(BASEPATH + '/backend/core');
    expect(core.logger).to.exist;
    expect(core.logger).to.be.a.function;
  });

  afterEach(function() {
    mockery.resetCache();
    mockery.deregisterAll();
    mockery.disable();
  });
});
