'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The authtoken controller', function() {
  it('getNewToken should return HTTP 500 if auth.getNewToken sends back error', function(done) {

    var auth = {
      getNewToken: function(options, callback) {
        return callback(new Error());
      }
    };
    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(500);
        done();
      }
    };
    controller.getNewToken(req, res);
  });

  it('getNewToken should return HTTP 500 if auth.getNewToken sends back empty token', function(done) {

    var auth = {
      getNewToken: function(options, callback) {
        return callback();
      }
    };
    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(500);
        done();
      }
    };
    controller.getNewToken(req, res);
  });

  it('getNewToken should return HTTP 200 if auth.getNewToken sends back token', function(done) {

    var auth = {
      getNewToken: function(options, callback) {
        return callback(null, {token: 1});
      }
    };
    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(200);
        done();
      }
    };
    controller.getNewToken(req, res);
  });

  it('getToken should return HTTP 400 if request does not contains token id', function(done) {
    mockery.registerMock('../../core/auth/token', {});
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(400);
        done();
      }
    };
    controller.getToken(req, res);
  });

  it('getToken should return HTTP 500 if auth.getToken sends back error', function(done) {

    var auth = {
      getToken: function(options, callback) {
        return callback(new Error());
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 456
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(500);
        done();
      }
    };
    controller.getToken(req, res);
  });

  it('getToken should return HTTP 404 if auth.getToken does not send back token', function(done) {

    var auth = {
      getToken: function(options, callback) {
        return callback();
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 456
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(404);
        done();
      }
    };
    controller.getToken(req, res);
  });

  it('getToken should return HTTP 200 if auth.getToken sends back token', function(done) {

    var auth = {
      getToken: function(options, callback) {
        return callback(null, {token: 123});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 456
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(200);
        done();
      }
    };
    controller.getToken(req, res);
  });

  it('isValid should return HTTP 400 if request does not contains token id', function(done) {

    var auth = {
      getToken: function(options, callback) {
        return callback(null, {token: 123});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(400);
        done();
      }
    };
    controller.isValid(req, res);
  });

  it('isValid should return HTTP 200 if auth.validateToken returns valid state', function(done) {

    var auth = {
      validateToken: function(token, callback) {
        return callback(true);
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(200);
        done();
      }
    };
    controller.isValid(req, res);
  });


  it('authenticateByToken should return HTTP 400 if token is not defined in request', function(done) {

    var auth = {
      validateToken: function(token, callback) {
        return callback(true);
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(400);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 500 if auth.getToken sends back error', function(done) {

    var auth = {
      getToken: function(token, callback) {
        return callback(new Error());
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(500);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 400 if auth.getToken does not send back token', function(done) {

    var auth = {
      getToken: function(token, callback) {
        return callback();
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(400);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 404 if auth.getToken does not send back user in token', function(done) {

    var auth = {
      getToken: function(token, callback) {
        return callback(null, {});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', {});

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(404);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 500 if user module does sends back error', function(done) {

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

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', user);

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(500);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 404 if user module does not sends back user', function(done) {

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

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', user);

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status) {
        expect(status).to.equal(404);
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should return HTTP 200 if user module sends back user', function(done) {

    var auth = {
      getToken: function(token, callback) {
        return callback(null, {user: 1, token: 123});
      }
    };

    var user = {
      get: function(id, callback) {
        return callback(null, {_id: 123, password: 456});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', user);

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      user: {
        _id: '123'
      },
      params: {
        token: 123
      }
    };
    var res = {
      json: function(status, json) {
        expect(status).to.equal(200);
        expect(json).to.exist;
        expect(json._id).to.exist;
        expect(json.password).to.not.exist;
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });

  it('authenticateByToken should log in when no user is set', function(done) {
    var auth = {
      getToken: function(token, callback) {
        return callback(null, {user: 1, token: 123});
      }
    };

    var user = {
      get: function(id, callback) {
        return callback(null, {_id: 123, password: 456});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', user);

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      _loginCalled: false,
      params: {
        token: 123
      },
      login: function(user, callback) {
        this._loginCalled = true;
        callback();
      }
    };
    var res = {
      json: function(status, json) {
        expect(status).to.equal(200);
        expect(json).to.exist;
        expect(json._id).to.exist;
        expect(json.password).to.not.exist;
        expect(req._loginCalled).to.be.true;
        done();
      }
    };
    controller.authenticateByToken(req, res);

  });

  it('authenticateByToken should not log in when a user is set', function(done) {
    var auth = {
      getToken: function(token, callback) {
        return callback(null, {user: 1, token: 123});
      }
    };

    var user = {
      get: function(id, callback) {
        return callback(null, {_id: 123, password: 456});
      }
    };

    mockery.registerMock('../../core/auth/token', auth);
    mockery.registerMock('../../core/user', user);

    var controller = this.helpers.requireBackend('webserver/controllers/authtoken');
    var req = {
      _loginCalled: false,
      user: { _id: 123, password: 456 },
      params: { token: 123 },
      login: function(user, callback) {
        this._loginCalled = true;
        callback();
      }
    };
    var res = {
      json: function(status, json) {
        expect(status).to.equal(200);
        expect(json).to.exist;
        expect(json._id).to.exist;
        expect(json.password).to.not.exist;
        expect(req._loginCalled).to.be.false;
        done();
      }
    };
    controller.authenticateByToken(req, res);
  });
});
