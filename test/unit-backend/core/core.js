'use strict';

var BASEPATH = '../../..';
var expect = require('chai').expect;

describe('The Core module', function() {

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

  it('should read/set the NODE_ENV environment variable', function() {
    /*jshint unused:false */
    var core = require(BASEPATH + '/backend/core');
    expect(process.env.NODE_ENV).to.equal('test');
  });

});
