'use strict';

var expect = require('chai').expect;

describe('The redis pubsub module', function() {
  var handler;

  beforeEach(function() {
    this.localpubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local.topic('redis:configurationAvailable');
    this.pubsub1 = require(this.testEnv.basePath + '/backend/core/pubsub/global').topic('testTopic');
    this.pubsub2 = require(this.testEnv.basePath + '/backend/core/pubsub/global').topic('testTopic');
    this.localpubsub.publish({
      port: this.testEnv.serversConfig.redis.port
    });
  });

  afterEach(function() {
    this.pubsub2.unsubscribe(handler);
  });

  it('should fire the callback of the subscribed channel', function(done) {
    handler = function() {done();};
    this.pubsub2.subscribe(handler);
    setTimeout(function() {this.pubsub1.publish({});}.bind(this), 1000);
  });

  it('should receive channel data', function(done) {
    var data = {
      test: true,
      foo: 'bar',
      nb: 42
    };
    handler = function(receivedData) {
      expect(receivedData).to.deep.equal(data);
      done();
    };
    this.pubsub2.subscribe(handler);
    setTimeout(function() {this.pubsub1.publish(data);}.bind(this), 1000);
  });

  it('should receive it\'s own message', function(done) {
    handler = function() {};
    var self = this;
    var handler1 = function() {
      self.pubsub1.unsubscribe(handler1);
      done();
    };

    this.pubsub1.subscribe(handler1);
    setTimeout(function() {this.pubsub1.publish({});}.bind(this), 1000);
  });

  it('should be able to unsubscribe', function(done) {
    handler = function(receivedData) {
      done(new Error('I should not be called'));
    };

    this.pubsub2.subscribe(handler);
    this.pubsub2.unsubscribe(handler);
    setTimeout(function() {this.pubsub1.publish({});}.bind(this), 1000);
    setTimeout(function() { done(); }, 2000);
  });

  it('should allow twice the same handler in a subscription', function(done) {
    var call_nb = 0;
    handler = function() {
      call_nb++;
      if (call_nb === 2) {
        done();
      }
    };
    this.pubsub2.subscribe(handler);
    this.pubsub2.subscribe(handler);
    setTimeout(function() {this.pubsub1.publish({});}.bind(this), 1000);
  });

  it('should unsubscribe all the handlers if they are the same', function(done) {
    handler = function() {
      done(new Error('I should not be called'));
    };
    this.pubsub2.subscribe(handler);
    this.pubsub2.subscribe(handler);
    this.pubsub2.unsubscribe(handler);
    setTimeout(function() {this.pubsub1.publish({});}.bind(this), 1000);
    setTimeout(function() { done(); }, 2000);
  });

});
