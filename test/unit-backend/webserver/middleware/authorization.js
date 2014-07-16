'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var ObjectId = require('bson').ObjectId;

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
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should call passport if user is not autenticated and bearer strategy is active', function(done) {
      var mock = {
        config: function() {
          return {
            auth: {
              strategies: ['bearer']
            }
          };
        }
      };
      mockery.registerMock('../../core', mock);

      var passport = {
        authenticate: function() {
          return function() {
            return done();
          };
        }
      };
      mockery.registerMock('passport', passport);

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresAPILogin;
      var req = {
        isAuthenticated: function() {
          return false;
        }
      };
      var res = {};
      var next = function() {
        return done(new Error());
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

    it('should return 400 if req.domain does not exist', function(done) {
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

    it('should return 400 if req.user._id does not exist', function(done) {
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

    it('should return 400 if req.domain.administrator does not exist', function(done) {
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
        _id: 123
      },
      domain: {
        _id: 111,
        administrator: {
          equals: function(id) {
            return 124 === id;
          }
        }
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
        _id: 123
      },
      domain: {
        _id: 111,
        administrator: {
          equals: function(id) {
            return 123 === id;
          }
        }
      }
    };
    var res = {
    };
    var next = function() {
      done();
    };
    middleware(req, res, next);
  });

  describe('The requiresDomainManager fn', function() {
    it('should send back 400 is there are no user in request', function(done) {
      var req = {
        domain: {}
      };
      var next = function() {};
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, next);
    });

    it('should send back 400 is there are no domain in request', function(done) {
      var req = {
        user: {}
      };
      var next = function() {};
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, next);
    });

    it('should call next if user is the domain manager', function(done) {
      var user_id = new ObjectId();
      var req = {
        domain: {
          administrator: user_id
        },
        user: {
          _id: user_id
        }
      };
      var res = {
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, done);
    });

    it('should send back 403 if current user domain list is null', function(done) {
      var user_id = new ObjectId();
      var req = {
        domain: {
          administrator: new ObjectId()
        },
        user: {
          _id: user_id
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, function() {});
    });

    it('should send back 403 if current user domain list is empty', function(done) {
      var user_id = new ObjectId();
      var req = {
        domain: {
          administrator: new ObjectId()
        },
        user: {
          _id: user_id,
          domains: []
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, function() {});
    });

    it('should send back 403 if current user does not belongs to the domain', function(done) {
      var user_id = new ObjectId();
      var req = {
        domain: {
          administrator: new ObjectId()
        },
        user: {
          _id: user_id,
          domains: [{domain_id: new ObjectId()}, {domain_id: new ObjectId()}]
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(403);
          done();
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, function() {});
    });

    it('should call next if current user belongs to the domain', function(done) {
      var user_id = new ObjectId();
      var domain_id = new ObjectId();
      var req = {
        domain: {
          _id: domain_id,
          administrator: new ObjectId()
        },
        user: {
          _id: user_id,
          domains: [{domain_id: new ObjectId()}, {domain_id: domain_id}]
        }
      };
      var res = {
        json: function(code) {
          done(new Error());
        }
      };

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/authorization').requiresDomainMember;
      middleware(req, res, done);
    });
  });
});
