'use strict';

var expect = require('chai').expect,
  mockery = require('mockery'),
  q = require('q');

function setupMocks(auth, user, technicaluser) {
  mockery.registerMock('../../core/auth/token', auth || {});
  mockery.registerMock('../../core/user', user || {});
  mockery.registerMock('../../core/technical-user', technicaluser || {});
  mockery.registerMock('../denormalize/user', {
    denormalize: function(user) {
      return q(user);
    }
  });
  mockery.registerMock('./utils', {
    sanitizeUser: function(user) {
      return user;
    },
    sanitizeTechnicalUser: function(user) {
      return user;
    }
  });
}

describe('The authtoken controller', function() {

  describe('The getNewToken function', function() {
    it('should return HTTP 500 if auth.getNewToken sends back error', function(done) {

      var auth = {
        getNewToken: function(options, callback) {
          return callback(new Error());
        }
      };
      setupMocks(auth);

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      controller.getNewToken(req, res);
    });

    it('should return HTTP 500 if auth.getNewToken sends back empty token', function(done) {

      var auth = {
        getNewToken: function(options, callback) {
          return callback();
        }
      };
      setupMocks(auth);

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      controller.getNewToken(req, res);
    });

    it('should return HTTP 200 if auth.getNewToken sends back token', function(done) {

      var auth = {
        getNewToken: function(options, callback) {
          return callback(null, {token: 1});
        }
      };
      setupMocks(auth);

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(200);
          done();
        }
      );
      controller.getNewToken(req, res);
    });
  });

  describe('The getToken function', function() {

    it('should return the request token', function(done) {
      setupMocks();

      var token = {
        _id: 123,
        user: 456
      };

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        },
        token: token
      };
      var res = this.helpers.express.jsonResponse(
        function(status, json) {
          expect(status).to.equal(200);
          expect(json).to.deep.equal(token);
          done();
        }
      );
      controller.getToken(req, res);
    });
  });

  describe('The isValid function', function() {

    it('should return HTTP 400 if request does not contains token id', function(done) {

      var auth = {
        getToken: function(options, callback) {
          return callback(null, {token: 123});
        }
      };

      setupMocks(auth);

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        },
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(400);
          done();
        }
      );
      controller.isValid(req, res);
    });

    it('should return HTTP 200 if auth.validateToken returns valid state', function(done) {

      var auth = {
        validateToken: function(token, callback) {
          return callback(true);
        }
      };

      setupMocks(auth);

      var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
      var req = {
        user: {
          _id: '123'
        },
        params: {
          token: 123
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(200);
          done();
        }
      );
      controller.isValid(req, res);
    });
  });

  describe('The authenticateByToken function', function() {

    function checkResponse(status, json, done) {
      return function(_status) {
        expect(_status).to.equal(status);
        return {
          json: function(_json) {
            expect(_json).to.deep.equal(json);
            done();
          }
        };
      };
    }

    describe('When req.token.user_type === technicalUser.TYPE', function() {
      it('should return HTTP 500 if technical user module does sends back error', function(done) {

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var type = 'technical';
        var technicalUser = {
          TYPE: type,
          get: function(id, callback) {
            return callback(new Error());
          }
        };

        setupMocks(auth, null, technicalUser);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {
            user_type: type
          }
        };
        var res = {
          status: checkResponse(500, {error: {code: 500, message: 'Server Error', details: 'Error while loading technical user'}}, done)
        };
        controller.authenticateByToken(req, res);
      });

      it('should return HTTP 404 if technical user module does not sends back user', function(done) {

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var type = 'technical';
        var technicalUser = {
          TYPE: type,
          get: function(id, callback) {
            return callback();
          }
        };

        setupMocks(auth, null, technicalUser);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {
            user_type: type
          }
        };
        var res = {
          status: checkResponse(404, {error: {code: 404, message: 'Not found', details: 'Technical User not found'}}, done)
        };
        controller.authenticateByToken(req, res);
      });

      it('should return HTTP 200 if technical user module sends back user', function(done) {

        var u = {_id: 123};

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var type = 'technical';
        var technicalUser = {
          TYPE: type,
          get: function(id, callback) {
            return callback(null, u);
          }
        };

        setupMocks(auth, null, technicalUser);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {
            user_type: type
          }
        };
        var res = {
          status: checkResponse(200, {_id: u._id, user_type: type}, done)
        };
        controller.authenticateByToken(req, res);
      });
    });

    describe('When req.token.user_type is not set', function() {

      it('should return HTTP 500 if user module does sends back error', function(done) {

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var user = {
          get: function(id, callback) {
            return callback(new Error());
          }
        };

        setupMocks(auth, user);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {}
        };
        var res = {
          status: checkResponse(500, {error: {code: 500, message: 'Server Error', details: 'Error while loading user'}}, done)
        };
        controller.authenticateByToken(req, res);
      });

      it('should return HTTP 404 if user module does not sends back user', function(done) {

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var user = {
          get: function(id, callback) {
            return callback();
          }
        };

        setupMocks(auth, user);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {}
        };
        var res = {
          status: checkResponse(404, {error: {code: 404, message: 'Not found', details: 'User not found'}}, done)
        };
        controller.authenticateByToken(req, res);
      });

      it('should return HTTP 200 if user module sends back user', function(done) {

        var u = {_id: 123, password: 456};

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var user = {
          get: function(id, callback) {
            return callback(null, u);
          }
        };

        setupMocks(auth, user);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          user: {
            _id: '123'
          },
          token: {}
        };
        var res = {
          status: checkResponse(200, u, done)
        };
        controller.authenticateByToken(req, res);
      });

      it('should log in when no user is set', function(done) {
        var u = {_id: 123, password: 456};

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var user = {
          get: function(id, callback) {
            return callback(null, u);
          }
        };

        setupMocks(auth, user);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          _loginCalled: false,
          token: {},
          login: function(user, callback) {
            this._loginCalled = true;
            callback();
          }
        };
        var res = this.helpers.express.jsonResponse(
          function(status, json) {
            expect(status).to.equal(200);
            expect(json).to.deep.equal(u);
            expect(req._loginCalled).to.be.true;
            done();
          }
        );
        controller.authenticateByToken(req, res);

      });

      it('should not log in when a user is set', function(done) {
        var u = {_id: 123, password: 456};

        var auth = {
          getToken: function(token, callback) {
            return callback(null, {user: 1, token: 123});
          }
        };

        var user = {
          get: function(id, callback) {
            return callback(null, u);
          }
        };

        setupMocks(auth, user);

        var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
        var req = {
          _loginCalled: false,
          user: u,
          token: {},
          login: function(user, callback) {
            this._loginCalled = true;
            callback();
          }
        };
        var res = this.helpers.express.jsonResponse(
          function(status, json) {
            expect(status).to.equal(200);
            expect(json).to.deep.equal(u);
            expect(req._loginCalled).to.be.false;
            done();
          }
        );
        controller.authenticateByToken(req, res);
      });
    });
  });
});
