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

    var token = this.helpers.requireBackend('core/auth/token');
    token.getNewToken({}, function(err) {
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

    var token = this.helpers.requireBackend('core/auth/token');
    token.getNewToken({}, function(err) {
      expect(err).to.exist;
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

    var token = this.helpers.requireBackend('core/auth/token');
    token.getNewToken({}, function(err) {
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

    var token = this.helpers.requireBackend('core/auth/token');
    token.getNewToken({}, function(err, options) {
      expect(called).to.be.true;
      expect(err).to.not.exist;
      expect(options.token).to.exist;
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
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

    var token = this.helpers.requireBackend('core/auth/token');
    token.getToken('ABC', function(err, token) {
      expect(err).to.not.exist;
      expect(token).to.exist;
      done();
    });
  });

});

