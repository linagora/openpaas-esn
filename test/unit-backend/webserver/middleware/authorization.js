'use strict';

var expect = require('chai').expect;

describe('The authorization middleware', function() {

  describe('The requiresAPILogin fn', function() {

    it('should send an error if user is not autenticated', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {
        json: function(code, error) {
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should call next if user is autenticated', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return true;
        }
      };
      var res = {
      };
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });
  });

  describe('The requiresDomainManager fn', function() {
    it('should return 400 is req.user does not exist', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
      var req = {
        domain: {
          _id: 123456789
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should return 400 is req.domain does not exist', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
      var req = {
        user: {
          _id: 123456789
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should return 400 is req.user._id does not exist', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
      var req = {
        user: {
        },
        domain: {
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });

    it('should return 400 is req.domain.administrator does not exist', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
      var req = {
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        }
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var next = function() {};
      middleware(req, res, next);
    });
  });

  it('should return 403 if req.user is not the domain administrator', function(done) {
    var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
    var req = {
      user: {
        _id: 123456789
      },
      domain: {
        _id: 987654321,
        administrator: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(403);
        done();
      }
    };
    var next = function() {};
    middleware(req, res, next);
  });


  it('should call next if req.user is the domain administrator', function(done) {
    var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainManager;
    var req = {
      user: {
        _id: 123456789
      },
      domain: {
        _id: 987654321,
        administrator: 123456789
      }
    };
    var res = {
    };
    var next = function() {
      done();
    };
    middleware(req, res, next);
  });
});
