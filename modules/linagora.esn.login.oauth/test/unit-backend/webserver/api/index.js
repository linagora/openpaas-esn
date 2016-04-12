'use strict';

var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var expect = chai.expect;

describe('The login oauth api module', function() {
  var deps;
  var configMock;
  var logger = {
    debug: function() {},
    info: function() {},
    warn: function() {}
  };
  var config = function() {
    return configMock;
  };
  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    configMock = {};
    deps = {
      logger: logger,
      config: config
    };
  });

  function getModule() {
    return require('../../../../backend/webserver/api/index')(dependencies);
  }

  it('should not fail when strategies are not defined', function() {
    var router = getModule();
    expect(router).to.be.defined;
  });

  it('should load all defined strategies', function() {
    configMock = {
      auth: {
        oauth: {
          strategies: ['facebook', 'twitter']
        }
      }
    };
    var facebookSpy = sinon.spy();
    var twitterSpy = sinon.spy();
    mockery.registerMock('./strategies/facebook', facebookSpy);
    mockery.registerMock('./strategies/twitter', twitterSpy);

    getModule();
    expect(facebookSpy).to.have.been.calledOnce;
    expect(twitterSpy).to.have.been.calledOnce;
  });

  it('should not fail when a strategy load call fails', function() {
    configMock = {
      auth: {
        oauth: {
          strategies: ['facebook']
        }
      }
    };

    mockery.registerMock('./strategies/facebook', function() {
      throw new Error('I failed');
    });

    getModule();
  });

  it('should not fail when a strategy does not exist', function() {
    configMock = {
      auth: {
        oauth: {
          strategies: ['facebook', 'foobar']
        }
      }
    };
    var facebookSpy = sinon.spy();
    mockery.registerMock('./strategies/facebook', facebookSpy);

    getModule();
    expect(facebookSpy).to.have.been.calledOnce;
  });
});
