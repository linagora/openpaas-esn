'use strict';

var chai = require('chai'),
  expect = chai.expect,
  mockery = require('mockery');

describe('The token authentication module', function() {

  it('getNewToken should send back error when redis#getClient send back error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(new Error());
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('getNewToken should send back error when redis#getClient does not send back client instance', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback();
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('getNewToken should send back error when config returns an error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {});
      }
    };

    mockery.registerMock('../db/redis', redis);
    this.helpers.mock.esnConfig(function(callback) {
      callback(new Error("too lazy"));
    });

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(err).to.exist;
      expect(err.message).to.equal("too lazy");
      done();
    });
  });

  it('getNewToken should send back error when session config is null', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {});
      }
    };

    mockery.registerMock('../db/redis', redis);
    this.helpers.mock.esnConfig(function(callback) {
      callback(null, null);
    });

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(err).to.exist;
      expect(err.message).to.equal("Missing session configuration");
      done();
    });
  });

  it('getNewToken should send back error when session secret is not set', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {});
      }
    };

    mockery.registerMock('../db/redis', redis);
    this.helpers.mock.esnConfig(function(callback) {
      callback(null, {});
    });

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(err).to.exist;
      expect(err.message).to.equal("Missing session configuration");
      done();
    });
  });

  it('getNewToken should send back error when redis client send back error', function(done) {
    var called = false;
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          setex: function(token, ttl, value, callback) {
            called = true;
            return callback(new Error());
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);
    this.helpers.mock.esnConfig(function(callback) {
      callback(null, { secret: 'secret' });
    });

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getNewToken({ user: 'abc123' }, function(err) {
      expect(called).to.be.true;
      expect(err).to.exist;
      done();
    });
  });

  it('getNewToken should send back a hash with toekn redis client is succesfully called', function(done) {
    var called = false;
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          setex: function(token, ttl, value, callback) {
            called = true;
            return callback();
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);
    this.helpers.mock.esnConfig(function(callback) {
      callback(null, { secret: 'secret' });
    });

    var config = require(this.testEnv.basePath + '/backend/core').config('default');
    var jwt = require('jsonwebtoken');
    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    var options = { user: 'abc123', ttl: 120 };
    token.getNewToken(options, function(err, options) {
      expect(called).to.be.true;
      expect(err).to.not.exist;
      expect(options.token).to.exist;

      var decoded = jwt.verify(options.token, "secret");
      expect(decoded.user).to.equal(options.user);
      expect(decoded.exp - decoded.iat).to.equal(options.ttl);

      done();
    });
  });

  it('validateToken should send false when redis client send back an error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(new Error());
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.validateToken('ABC', function(bool) {
      expect(bool).to.be.false;
      done();
    });
  });

  it('validateToken should send false when redis client #get send back an error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback(new Error());
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.validateToken('ABC', function(bool) {
      expect(bool).to.be.false;
      done();
    });
  });

  it('validateToken should send false when redis client #get does not return data', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback();
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.validateToken('ABC', function(bool) {
      expect(bool).to.be.false;
      done();
    });
  });

  it('validateToken should send true when redis client #get returns data', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback(null, {foo: 'bar'});
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.validateToken('ABC', function(bool) {
      expect(bool).to.be.true;
      done();
    });
  });

  it('getToken should send back error when redis getClient send back error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(new Error());
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getToken('ABC', function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('getToken should send back error when redis client #get send back error', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback(new Error());
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getToken('ABC', function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('getToken should send back nothing when redis client #get sends back nothing', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback();
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getToken('ABC', function(err, token) {
      expect(err).to.not.exist;
      expect(token).to.not.exist;
      done();
    });
  });

  it('getToken should send back token hash when redis client #get sends back data', function(done) {
    var redis = {
      getClient: function(callback) {
        return callback(null, {
          get: function(token, callback) {
            return callback(null, JSON.stringify({foo: 'bar'}));
          }
        });
      }
    };
    mockery.registerMock('../db/redis', redis);

    var token = require(this.testEnv.basePath + '/backend/core/auth/token');
    token.getToken('ABC', function(err, token) {
      expect(err).to.not.exist;
      expect(token).to.exist;
      done();
    });
  });

});

