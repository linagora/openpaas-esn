'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The OAuth Consumer controller', function() {

  var deps;
  var req;
  var type = 'social';
  var logger = {
    debug: function() {},
    info: function() {}
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    deps = {
      logger: logger
    };
    req = {
      query: {},
      user: {
        _id: 1
      }
    };
  });

  function getController() {
    return require('../../../../../backend/webserver/api/oauth/controller')(dependencies);
  }

  describe('The finalizeWorkflow controller', function() {

    it('should redirect to /#/accounts?provider=social when ok', function(done) {
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/accounts?provider=social');
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });

    it('should redirect to /#/accounts?provider=social&status=:status when status is defined in req.oauth', function(done) {
      var status = 'created';
      req.oauth = {
        status: status
      };
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/accounts?provider=social&status=' + status);
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });

    it('should redirect to /#/accounts?status=denied&provider=social&token=:token when req.query.denied', function(done) {
      var token = '12345';
      req.query.denied = token;
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/accounts?status=denied&provider=social&token=' + token);
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });
  });
});
