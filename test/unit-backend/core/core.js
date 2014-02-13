'use strict';

require('../all');

var expect = require('chai').expect;

describe('The Core module', function() {
  var core = null;

  beforeEach(function() {
    core = require(this.testEnv.basePath + '/backend/core');
  });

  it('should contains a config property', function() {
    expect(core.config).to.exist;
    expect(core.config).to.be.a.function;
  });

  it('should contains a logger property', function() {
    expect(core.logger).to.exist;
    expect(core.logger).to.be.a.function;
  });

  it('should read/set the NODE_ENV environment variable', function() {
    expect(process.env.NODE_ENV).to.equal('test');
  });

});
