'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../..';

describe('The Core module logger property', function() {

  it('should exist', function() {
    var core = require(BASEPATH + '/backend/core');
    expect(core.logger).to.exist;
    expect(core.logger).to.be.a.function;
  });

  it('should return a logger object', function() {
    var core = require(BASEPATH + '/backend/core');
    var logger = core.logger;
    expect(logger.log).to.be.a.Function;
    expect(logger.info).to.be.a.Function;
    expect(logger.warn).to.be.a.Function;
    expect(logger.error).to.be.a.Function;
  });

});
