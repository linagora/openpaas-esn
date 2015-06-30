'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

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
        expect(name).to.equal('x-esn-task-id');
        expect(value).to.equal(id);
      },
      json: function(code) {
        expect(code).to.equal(202);
        done();
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
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    }, {});
  });
});
