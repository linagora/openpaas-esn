'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The login-rules middleware', function() {

  beforeEach(function() {
    var loggerMock = {
      error: function() {}
    };
    mockery.registerMock('../../core/logger', loggerMock);
  });

  describe('The checkLoginCount function', function() {

    it('should call next when username is not set', function(done) {
      var req = {
        body: {}
      };

      var next = function() {
        done();
      };

      var userLoginMocked = {
        canLogin: function() {
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {};
      mockery.registerMock('../../core/user', userMocked);

      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, {}, next);
    });

    it('should call next when user login limit is not reached', function(done) {
      var req = {
        body: {
          username: 'aUsername'
        }
      };

      var next = function() {
        expect(req.recaptchaFlag).not.to.exist;
        done();
      };

      var userLoginMocked = {
        canLogin: function(username, callback) {
          callback(null, true);
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {
        findByEmail: function(email, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('../../core/user', userMocked);

      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, {}, next);
    });

    it('should add a flag recaptchaFlag setted to true with too many attemps', function(done) {
      var req = {
        body: {
          username: 'aUsername'
        }
      };

      var next = function() {
        expect(req.recaptchaFlag).to.be.true;
        done();
      };

      var userLoginMocked = {
        canLogin: function(username, callback) {
          callback(null, false);
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {
        findByEmail: function(email, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('../../core/user', userMocked);
      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, {}, next);
    });

    it('should return 500 on error with canLogin method', function(done) {
      var req = {
        body: {
          username: 'aUsername'
        }
      };

      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error.message).to.match(/Server Error/);
          done();
        }
      );

      var userLoginMocked = {
        canLogin: function(username, callback) {
          callback(new Error(''), false);
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {
        findByEmail: function(email, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('../../core/user', userMocked);

      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, res, {});
    });

    it('should return 500 on error with findByEmail method', function(done) {
      var req = {
        body: {
          username: 'aUsername'
        }
      };

      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error.message).to.match(/Server Error/);
          done();
        }
      );

      var userLoginMocked = {
        canLogin: function() {
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {
        findByEmail: function(email, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/user', userMocked);

      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, res, {});
    });

    it('should call next if user is not found', function(done) {
      var req = {
        body: {
          username: 'aUsername'
        }
      };

      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.message).to.equal('Server Error');
          done();
        }
      );

      var userLoginMocked = {
        canLogin: function() {
        }
      };
      mockery.registerMock('../../core/user/login', userLoginMocked);

      var userMocked = {
        findByEmail: function(email, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/user', userMocked);

      var middleware = this.helpers.requireBackend('webserver/middleware/login-rules').checkLoginCount;
      middleware(req, res, function() {
        done();
      });
    });
  });

  describe('The checkDisabled function', function() {

    it('should call next when username is not set', function(done) {
      var req = {
        body: {}
      };

      mockery.registerMock('../../core/user/login', {});
      mockery.registerMock('../../core/user', {
        findByEmail: function() {
          done(new Error());
        }
      });

      this.helpers.requireBackend('webserver/middleware/login-rules').checkDisabled(req, {}, done);
    });
  });

  it('should return error when user.findByEmail fails', function(done) {
    var req = {
      body: {
        username: 'aUsername'
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, data) {
        expect(code).to.equal(500);
        expect(data.error.message).to.match(/Server Error/);
        done();
      }
    );

    mockery.registerMock('../../core/user/login', {});
    mockery.registerMock('../../core/user', {
      findByEmail: function(email, callback) {
        return callback(new Error());
      }
    });

    this.helpers.requireBackend('webserver/middleware/login-rules').checkDisabled(req, res, function() {
      done(new Error());
    });
  });

  it('should call next when user is not found', function(done) {
    var req = {
      body: {
        username: 'aUsername'
      }
    };

    mockery.registerMock('../../core/user/login', {});
    mockery.registerMock('../../core/user', {
      findByEmail: function(email, callback) {
        return callback();
      }
    });

    this.helpers.requireBackend('webserver/middleware/login-rules').checkDisabled(req, {}, done);
  });

  it('should return HTTP 403 when user is disabled', function(done) {
    var req = {
      body: {
        username: 'aUsername'
      }
    };

    var res = this.helpers.express.jsonResponse(
      function(code, data) {
        expect(code).to.equal(403);
        expect(data.error.message).to.match(/Forbidden/);
        expect(data.error.details).to.match(/The specified account is disabled/);
        done();
      }
    );

    mockery.registerMock('../../core/user/login', {});
    mockery.registerMock('../../core/user', {
      findByEmail: function(email, callback) {
        return callback(null, { states: [{ name: 'login', value: 'disabled' }] });
      },
      states: {
        isEnabled: function() {
          return false;
        }
      }
    });

    this.helpers.requireBackend('webserver/middleware/login-rules').checkDisabled(req, res, function() {
      done(new Error());
    });
  });

  it('should call next when user is not disabled', function(done) {
    var req = {
      body: {
        username: 'aUsername'
      }
    };

    mockery.registerMock('../../core/user/login', {});
    mockery.registerMock('../../core/user', {
      findByEmail: function(email, callback) {
        return callback(null, { states: [{ name: 'login', value: 'enabled' }] });
      },
      states: {
        isEnabled: function() {
          return true;
        }
      }
    });

    this.helpers.requireBackend('webserver/middleware/login-rules').checkDisabled(req, {}, done);
  });

});
