'use strict';

var BASEPATH = '../../..';
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
console.log(tmp);

describe('The passport configuration module', function() {

  it('should not fail with default configuration settings (file)', function(done) {
    require(BASEPATH + '/backend/webserver/passport');
    var passport = require('passport');
    expect(passport._strategy('local')).to.exist;
    done();
  });

  it('should not fail when auth module is not defined in configuration (hardcoded)', function(done) {
    require(BASEPATH + '/backend/webserver/passport');
    var passport = require('passport');
    expect(passport._strategy('local')).to.exist;
    done();
  });

  describe('Invalid configuration', function() {
    beforeEach(function() {
      process.env.NODE_CONFIG = tmp;
    });

    afterEach(function() {
      delete process.env.NODE_CONFIG;
    });

    it('should not fail when auth module is defined but does not exists', function(done) {
      fs.writeFileSync(tmp + '/default.json', JSON.stringify({auth: {strategies: ['foobar']}}));
      require(BASEPATH + '/backend/webserver/passport');
      var passport = require('passport');
      expect(passport._strategy('foobar')).to.be.undefined;
      done();
    });
  });
});
