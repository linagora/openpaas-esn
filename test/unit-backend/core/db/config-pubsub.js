'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The local pubsub for MongoDB configuration', function() {
  var pubsub = null;

  before(function() {
    this.testEnv.writeDBConfigFile();
    pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local;
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  it('should fire a publish when mongodb configuration is available', function(done) {

    var mongodb = {
      hostname: 'localhost',
      port: 27017,
      dbname: 'hiveety-test'
    };
    
    var topic = pubsub.topic('mongodb:configurationAvailable');
    var configuredMock =
      function() {
        topic.publish(mongodb);
        return true;
      };

    mockery.registerMock('../configured', configuredMock);

    var core = require(this.testEnv.basePath + '/backend/core');
    var templates = core.templates;

    topic.subscribe(function(config) {
      expect(config).to.deep.equal(mongodb);
      done();
    });
    
    templates.inject(function() {});
  });
});