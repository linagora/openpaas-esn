'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The proxy middleware', function() {

  var deps, dependencies;
  var modulePath = '../../../../backend/webserver/proxy/middleware';

  beforeEach(function() {
    dependencies = {
      tokenMW: {
      },
      logger: {
        error: function() {
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

  describe('The generateNewToken function', function() {

    it('should generate the token with the graceperiod', function(done) {
      var req = {query: {graceperiod: 2}, user: {_id: 123}};
      dependencies.tokenMW.generateNewToken = function(ttl) {
        expect(ttl >= req.query.graceperiod).to.be.true;
        return function() {
          return done();
        };
      };

      require(modulePath)(deps).generateNewToken(req);
    });
  });

  describe('The removeContentLength function', function() {

    it('should remove content-length if headers exists', function(done) {
      var req = { headers: { 'content-length': 12345, 'content-type': 'application/json' } };
      require(modulePath)(deps).removeContentLength(req, {}, function() {
        expect(req.headers).to.deep.equal({ 'content-type': 'application/json' });
        done();
      });
    });
  });
});
