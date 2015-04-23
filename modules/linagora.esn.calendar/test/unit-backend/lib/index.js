'use strict';

var expect = require('chai').expect;

describe('The awesome module api', function() {

  it('should have a start method', function() {
    require('../../../backend/lib/index')({}, function(err, lib) {
      expect(lib.start).to.be.a('function');
    });
  });

});
