'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The webserver document-store middleware', function() {

  beforeEach(function() {
    this.configured = false;
    var configuredMock = function() {
      return this.configured;
    };

    mockery.registerMock('../../core', {configured: configuredMock.bind(this), db: {mongo: {}}});
  });

  describe('The failIfConfigured function', function() {

    var failIfConfigured;

    beforeEach(function() {
      failIfConfigured = this.helpers.requireBackend('webserver/middleware/document-store').failIfConfigured;
    });

    it('should call next() if the system is not configured', function(done) {
      this.configured = false;
      var req = {};
      var res = {};
      var next = done;

      failIfConfigured(req, res, next);
    });

    it('should call res.json(400) if the system is configured', function(done) {
      this.configured = true;
      var req = {};
      var res = {
        status: function(code) {
          expect(code).to.equal(400);

          return {
            json: function(data) {
              expect(data.error.details).to.equal('the database connection is already configured');
              done();
            }
          };
        }
      };

      failIfConfigured(req, res);
    });
  });

});
