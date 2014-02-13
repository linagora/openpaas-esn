'use strict';

require('../all');

var expect = require('chai').expect;

describe('The Core module logger property', function() {
  var core = null;

  beforeEach(function() {
    core = require(this.testEnv.basePath + '/backend/core');
  });

  it('should exist', function() {
    expect(core.logger).to.exist;
    expect(core.logger).to.be.a.function;
  });

  it('should return a logger object', function() {
    var logger = core.logger;
    expect(logger.log).to.be.a.Function;
    expect(logger.info).to.be.a.Function;
    expect(logger.warn).to.be.a.Function;
    expect(logger.error).to.be.a.Function;
  });

});
