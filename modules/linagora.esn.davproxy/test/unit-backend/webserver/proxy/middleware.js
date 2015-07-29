'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The proxy middleware', function() {

  var deps, dependencies;

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

      require('../../../../backend/webserver/proxy/middleware')(deps).generateNewToken(req);
    });
  });
});
