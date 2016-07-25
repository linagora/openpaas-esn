'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The davserver middleware', function() {

  var utilsMock;

  beforeEach(function() {
    utilsMock = {};

    mockery.registerMock('../../lib/utils', function() {
      return utilsMock;
    });
  });

  describe('The getDavEndpoint function', function() {

    var middleware;

    beforeEach(function() {
      middleware = require('../../../backend/webserver/api/middleware')().getDavEndpoint;
    });

    it('should set req.davserver then call next', function(done) {
      var req = {
        user: { preferredDomainId: 'domain123' }
      };
      var davServerUrl = 'http://localhost';

      utilsMock.getDavEndpoint = function(domainId, callback) {
        expect(domainId).to.equal(req.user.preferredDomainId);
        callback(davServerUrl);
      };

      var next = function() {
        expect(req.davserver).to.equal(davServerUrl);
        done();
      };

      middleware(req, {}, next);
    });

  });
});
