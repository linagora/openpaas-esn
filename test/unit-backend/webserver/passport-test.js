'use strict';

var BASEPATH = '../../..';
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
console.log(tmp);

describe('The passport configuration module', function() {

  describe('Default configuration', function() {
    it('should not fail with default configuration settings (file)', function(done) {
      var passport = require(BASEPATH + '/backend/webserver/passport');
      expect(passport).to.exist;
      done();
    });

    it('should not fail when auth module is not defined in configuration (hardcoded)', function(done) {
      var passport = require(BASEPATH + '/backend/webserver/passport');
      expect(passport).to.exist;
      done();
    });
  });

  describe('Invalid configuration', function() {
    beforeEach(function() {
      process.env.NODE_CONFIG = tmp;
    });

    afterEach(function() {
      delete process.env.NODE_CONFIG;
    });

    it('should fail when auth module is is defined but does not exists', function(done) {
      fs.writeFileSync(tmp + '/default.json', JSON.stringify({auth : {strategy : 'foobar'}}));
      try {
        require(BASEPATH + '/backend/webserver/passport');
      } catch(err) {
        expect(err).to.be.not.null;
        done();
      }
    });
  });
});
