'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The webserver document-store middleware', function() {

  var configured = false;

  beforeEach(function() {
    var configuredMock = function() {
      return configured;
    };

    mockery.registerMock('../../core', {configured: configuredMock.bind(this), db: {mongo: {}}});
  });

  describe('The failIfConfigured function', function() {

    var failIfConfigured;

    beforeEach(function() {
      failIfConfigured = this.helpers.requireBackend('webserver/middleware/document-store').failIfConfigured;
    });

    it('should call next() if the system is not configured', function(done) {
      configured = false;

      failIfConfigured({}, {}, done);
    });

    it('should call res.json(400) if the system is configured', function(done) {
      configured = true;

      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error.details).to.equal('the database connection is already configured');
          done();
        }
      );

      failIfConfigured({}, res);
    });
  });

});
