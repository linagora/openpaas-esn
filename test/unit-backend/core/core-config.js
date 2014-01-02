'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../..';

describe('The Core module config property', function() {

  it('should exist', function() {
    var core = require(BASEPATH + '/backend/core');
    expect(core.config).to.exist;
    expect(core.config).to.be.a.function;
  });

  it('should return a JSON object for default namespace', function() {
    var core = require(BASEPATH + '/backend/core');
    var config = core.config('default');
    expect(config).to.be.an.Object;
  });

  it('should have test specific key "for-the-test"', function() {
    var core = require(BASEPATH + '/backend/core');
    var config = core.config('default');
    expect(config['for-the-test']).to.equal('This key is only set in the test configuration file');
  });

});
