'use strict';

require('../../all');

var expect = require('chai').expect,
    fs = require('fs');

describe('The User template module', function() {

  describe('If not configured', function() {

    before(function() {
      try {
        fs.unlinkSync(this.testEnv.tmp + '/db.json');
      } catch (e) {}
    });

    it('should not inject templates', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core');
      var templates = core.templates;
      var configured = core.configured;
      expect(configured()).to.be.false;
      templates.inject(done);
    });
  });

  describe('If configured', function() {

    before(function() {
      var mongo = {hostname: 'localhost', port: 27017, dbname: 'test'};
      fs.writeFileSync(this.testEnv.tmp + '/db.json', JSON.stringify(mongo));
    });

    it('should inject templates', function(done) {
      var core = require(this.testEnv.basePath + '/backend/core');
      var templates = core.templates;
      var configured = core.configured;
      expect(configured()).to.be.true;
      templates.inject(done);
    });

    after(function() {
      fs.unlinkSync(this.testEnv.tmp + '/db.json');
    });
  });

});
