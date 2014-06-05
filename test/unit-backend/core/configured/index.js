'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The Core configured module', function() {
  var isConfigured = null;
  var mockPubSub = null;

  beforeEach(function() {
    mockPubSub = this.helpers.mock.pubsub;
  });

  it('should return false if the db.json file does not exist', function() {
    var coreMock = {
      config: function() {
        return null;
      }
    };
    mockery.registerMock('..', coreMock);
    isConfigured = require(this.testEnv.basePath + '/backend/core').configured;
    expect(isConfigured()).to.be.false;
  });

  it('should return false if the db.json file exists but does not contain the tested key(connectionString)', function() {
    var coreMock = {
      config: function() {
        return {
          foo: 'bar'
        };
      }
    };
    mockery.registerMock('..', coreMock);
    isConfigured = require(this.testEnv.basePath + '/backend/core').configured;
    expect(isConfigured()).to.be.false;
  });

  it('should return true if the db.json file exists and contains the tested key(connectionString)', function() {
    var coreMock = {
      config: function() {
        return {
          connectionString: 'url'
        };
      }
    };
    mockery.registerMock('..', coreMock);

    var stub = {};
    mockPubSub('../pubsub', stub);

    isConfigured = require(this.testEnv.basePath + '/backend/core').configured;
    expect(isConfigured()).to.be.true;
    expect(stub.topics['mongodb:configurationAvailable'].data[0]).to.deep.equal({
        connectionString: 'url'
      }
    );
  });
});
