'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');
var sinon = require('sinon');

describe('The in memory grace period module', function() {

  var dependencies, deps;

  beforeEach(function() {
    dependencies = {
      graceperiod: {},
      logger: {
        error: function() {},
        debug: function() {},
        info: function() {}
      }
    };

    deps = function(name) {
      return dependencies[name];
    };

    mockery.registerMock('request', {});
  });

  function getModule() {
    return require('../../../../../backend/webserver/proxy/graceperiod/memory')(deps);
  }

  it('should create a new graceperiod task and send back HTTP 202 with id', function(done) {
    var id = 1;
    var defer = q.defer();
    defer.resolve({id: id});
    dependencies.graceperiod = {
      create: function() {
        return defer.promise;
      }
    };

    getModule()({user: {_id: 2}}, {
      set: function(name, value) {
        expect(name).to.equal('X-ESN-Task-Id');
        expect(value).to.equal(id);
      },
      status: function(code) {
        expect(code).to.equal(202);

        return {
          json: function() {
            done();
          }
        };
      }
    }, {});
  });

  it('should create send back HTTP 500 when graceperiod#create fails', function(done) {
    var defer = q.defer();
    defer.reject(new Error());
    dependencies.graceperiod = {
      create: function() {
        return defer.promise;
      }
    };

    getModule()({user: {_id: 2}}, {
      status: function(code) {
        expect(code).to.equal(500);

        return {
          json: function() {
            done();
          }
        };
      }
    }, {});
  });

  it('should use input delay', function(done) {
    const graceperiod = 100;
    const task = {id: 1};

    dependencies.graceperiod = {
      create: sinon.spy(function() {
        return Promise.resolve(task);
      })
    };

    getModule()({user: {_id: 2}}, {
      set: sinon.spy(),
      status: function(code) {
        expect(code).to.equal(202);
        expect(dependencies.graceperiod.create).to.have.been.calledWith(sinon.match.func, graceperiod);

        return {
          json: function() {
            done();
          }
        };
      }
    }, { graceperiod });
  });

  describe('in DEV mode', function() {
    let nodeEnv;

    beforeEach(function() {
      nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'dev';
    });

    afterEach(function() {
      process.env.NODE_ENV = nodeEnv;
    });

    it('should use DEV_DELAY as input delay', function(done) {
      const graceperiod = 'this is a dummy grace period which will never be valid but for tests';
      const task = {id: 1};

      dependencies.graceperiod = {
        create: sinon.spy(function() {
          return Promise.resolve(task);
        })
      };

      getModule()({user: {_id: 2}}, {
        set: sinon.spy(),
        status: function(code) {
          expect(code).to.equal(202);
          expect(dependencies.graceperiod.create).to.have.been.calledWith(sinon.match.func, sinon.match(value => value !== graceperiod));

          return {
            json: function() {
              done();
            }
          };
        }
      }, { graceperiod });
    });
  });

  describe('forwardRequest method', function() {
    var req, options;

    beforeEach(function() {
      req = {
        method: 'PUT',
        headers: {
          'A HEADER': 'WITH THIS VALUE'
        },
        body: 'aBody',
        url: '.json',
        token: { token: 'a new token' },
        user: { _id: 'aId' }
      };
      options = {
        endpoint: 'api',
        path: 'sabre',
        json: true
      };
      dependencies.graceperiod = {
        create: function(forwardRequest) {
          return q.when({id: forwardRequest});
        }
      };
    });

    it('should call the http client with the correct request', function(done) {
      mockery.registerMock('../http-client', function(requestOptions) {
        expect(requestOptions).to.deep.equal({
          method: 'PUT',
          url: 'api/sabre.json',
          headers: {
            'A HEADER': 'WITH THIS VALUE',
            ESNToken: 'a new token'
          },
          json: true,
          body: 'aBody'
        });
        done();
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest();
            }
          };
        }
      }, options);
    });

    it('should not append the body if method is DELETE', function(done) {
      req.method = 'DELETE';
      mockery.registerMock('../http-client', function(requestOptions) {
        expect(requestOptions).to.deep.equal({
          method: 'DELETE',
          url: 'api/sabre.json',
          headers: {
            'A HEADER': 'WITH THIS VALUE',
            ESNToken: 'a new token'
          },
          json: true
        });
        done();
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest();
            }
          };
        }
      }, options);
    });

    it('should call the callback with an error if the client has failed', function(done) {
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(new Error());
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err) {
                expect(err).to.exist;

                done();
              });
            }
          };
        }
      }, options);
    });

    it('should call options.onError if it\'s defined and the client has failed', function(done) {
      options.onError = sinon.spy(function(response, body, req, res, callback) {
        callback();
      });
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(new Error());
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err) {
                expect(err).to.exist;
                expect(options.onError).to.have.been.called;

                done();
              });
            }
          };
        }
      }, options);
    });

    it('should call onSuccess if it is defined and the client has succeeded with a 2XX http code', function(done) {
      options.onSuccess = sinon.spy(function(response, body, req, res, callback) {
        callback();
      });
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(null, {statusCode: 200});
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err, response) {
                expect(err).to.not.exist;
                expect(options.onSuccess).to.have.been.called;
                expect(response).to.deep.equal({statusCode: 200});

                done();
              });
            }
          };
        }
      }, options);
    });

    it('should call the callback if the client has succeeded', function(done) {
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(null, {statusCode: 200});
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err, response) {
                expect(err).to.not.exist;
                expect(response).to.deep.equal({statusCode: 200});

                done();
              });
            }
          };
        }
      }, options);
    });

    it('should call the callback with an error if the client has failed with a not 2XX http code', function(done) {
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(null, {statusCode: 412});
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err, response) {
                expect(err).to.exist;
                expect(response).to.deep.equal({statusCode: 412});

                done();
              });
            }
          };
        }
      }, options);
    });

    it('should call onError if defined and with an error if the client has failed with a not 2XX http code', function(done) {
      options.onError = sinon.spy(function(response, body, req, res, callback) {
        callback();
      });
      mockery.registerMock('../http-client', function(requestOptions, callback) {
        callback(null, {statusCode: 412});
      });
      getModule()(req, {
        set: function() {},
        status: function() {
          return {
            json: function(task) {
              var forwardRequest = task.id;
              forwardRequest(function(err, response) {
                expect(err).to.exist;
                expect(options.onError).to.have.been.called;
                expect(response).to.deep.equal({statusCode: 412});

                done();
              });
            }
          };
        }
      }, options);
    });
  });
});
