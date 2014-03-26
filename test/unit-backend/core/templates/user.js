'use strict';

var expect = require('chai').expect;

describe('The User template module', function() {

  describe('If not configured', function() {

    before(function() {
      try {
        this.testEnv.removeDBConfigFile();
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

    beforeEach(function() {
      this.testEnv.writeDBConfigFile();
      this.mongoose = require('mongoose');
    });

    it('should inject templates', function(done) {
      var core = this.testEnv.initCore();
      var templates = core.templates;
      var configured = core.configured;
      expect(configured()).to.be.true;
      templates.inject(done);
    });

    afterEach(function(done) {
      this.testEnv.removeDBConfigFile();
      this.mongoose.connection.db.dropDatabase(function(err, ok) {
        if (err) { return done(err); }
        this.mongoose.disconnect(done);
      }.bind(this));
    });
  });

});
