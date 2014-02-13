'use strict';

require('../all');

var expect = require('chai').expect;

describe('The Core module config property', function() {

  var core = null;

  beforeEach(function() {
    core = require(this.testEnv.basePath + '/backend/core');
  });

  it('should exist', function() {
    expect(core.config).to.exist;
    expect(core.config).to.be.a.function;
  });

  it('should return a JSON object for default namespace', function() {
    var config = core.config('default');
    expect(config).to.be.an.Object;
  });

  it('should have test specific key "for-the-test"', function() {
    var config = core.config('default');
    expect(config['for-the-test']).to.equal('This key is only set in the test configuration file');
  });

});
