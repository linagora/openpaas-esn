'use strict';

require('../all');

var expect = require('chai').expect,
    fs = require('fs');

describe('The passport configuration module', function() {

  it('should not fail with default configuration settings (file)', function(done) {
    require(this.testEnv.basePath + '/backend/webserver/passport');
    var passport = require('passport');
    expect(passport._strategy('local')).to.exist;
    done();
  });

  describe('Invalid configuration', function() {
    var oldDefaultJson = null;

    before(function() {
      oldDefaultJson = fs.readFileSync(this.testEnv.tmp + '/default.json');
    });

    it('should not fail when auth module is defined but does not exists', function(done) {
      var conf = {
        log: {
          file: {
            enabled: false
          },
          console: {
            enabled: false
          }
        },
        auth: {
          strategies: ['foobar']
        }
      };
      fs.writeFileSync(this.testEnv.tmp + '/default.json', JSON.stringify(conf));
      require(this.testEnv.basePath + '/backend/webserver/passport');
      var passport = require('passport');
      expect(passport._strategy('foobar')).to.be.undefined;
      done();
    });

    after(function() {
      fs.writeFileSync(this.testEnv.tmp + '/default.json', oldDefaultJson);
    });

  });
});
