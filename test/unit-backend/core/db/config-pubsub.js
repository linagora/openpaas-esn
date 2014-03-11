'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The local pubsub for MongoDB configuration', function() {
  var pubsub = null;

  beforeEach(function() {
    this.testEnv.writeDBConfigFile();
    pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local;
  });

  afterEach(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should fire a publish when mongodb configuration is available', function(done) {

    var mongodb = {
      hostname: 'localhost',
      port: 27017,
      dbname: 'hiveety-test'
    };

    var configuredMock = {
      isConfigured: function() {
        var topic = pubsub.topic('mongodb:configurationAvailable');
        topic.publish(mongodb);
        done();
      }
    };

    mockery.registerMock('./configured', configuredMock);

    var topic = pubsub.topic('mongodb:configurationAvailable');
    topic.subscribe(function(config) {
      expect(config).to.equal(mongodb);
    });
  });
});
