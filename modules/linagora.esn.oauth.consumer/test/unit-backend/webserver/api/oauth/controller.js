'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

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

    it('should redirect to /#/controlcenter/accounts?provider=social when ok', function(done) {
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/controlcenter/accounts?provider=social');
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });

    it('should redirect to /#/controlcenter/accounts?provider=social&status=:status when status is defined in req.oauth', function(done) {
      var status = 'created';
      req.oauth = {
        status: status
      };
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/controlcenter/accounts?provider=social&status=' + status);
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });

    it('should redirect to /#/controlcenter/accounts?status=denied&provider=social&token=:token when req.query.denied', function(done) {
      var token = '12345';
      req.query.denied = token;
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/#/controlcenter/accounts?status=denied&provider=social&token=' + token);
          done();
        }
      };
      getController().finalizeWorkflow(type, req, res);
    });
  });

  describe('The unknownAuthErrorMiddleware function', function() {

    var TYPE = 'twitter';
    var ERR_MSG = 'This is an error';
    var REGEXP = new RegExp(ERR_MSG);

    it('should call redirect when err.message matched regexp', function(done) {
      var spy = sinon.spy();
      var res = {
        redirect: spy
      };
      var middleware = getController().unknownAuthErrorMiddleware(TYPE, REGEXP);
      middleware(new Error(ERR_MSG), {}, res, done);
      expect(spy).to.have.been.calledWith('/#/controlcenter/accounts?status=config_error&provider=' + TYPE);
      done();
    });

    it('should not call redirect when err.message does not match regexp', function(done) {
      var spy = sinon.spy();
      var res = {
        redirect: spy
      };
      var e = new Error('Another error');
      var middleware = getController().unknownAuthErrorMiddleware(TYPE, REGEXP);
      middleware(e, {}, res, function(_err) {
        expect(_err).to.equal(e);
        expect(spy).to.not.have.been.called;
        done();
      });
    });

    it('should call next when err.message is not defined', function(done) {
      var spy = sinon.spy();
      var res = {
        redirect: spy
      };
      var e = {};
      var middleware = getController().unknownAuthErrorMiddleware(TYPE, REGEXP);
      middleware(e, {}, res, function(_err) {
        expect(_err).to.equal(e);
        expect(spy).to.not.have.been.called;
        done();
      });
    });

    it('should call next when err is not defined', function(done) {
      var spy = sinon.spy();
      var res = {
        redirect: spy
      };
      var middleware = getController().unknownAuthErrorMiddleware(TYPE, REGEXP);
      middleware(null, {}, res, function(_err) {
        expect(_err).to.be.null;
        expect(spy).to.not.have.been.called;
        done();
      });
    });

  });
});
