'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../../..';

describe('The global Pubsub object', function() {
  it('should have a topic method', function() {
    var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
    expect(RedisPubsub).to.respondTo('topic');
  });
  
  describe('topic method result', function() {
    it('should have publish, subscribe and unsubscribe methods', function() {
      var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
      var pubsub = new RedisPubsub();
      var topic = pubsub.topic('test');
      expect(topic).to.respondTo('publish');
      expect(topic).to.respondTo('subscribe');
      expect(topic).to.respondTo('unsubscribe');
    });
  });
  
  it('should call the client "on" method when subscribing to an event', function(done) {
    
    var client = {
      on: function(topicName, topicHandler) {
        expect(topicName).to.equal('test');
        done();
      }
    };
    
    var handler = function() { /*nothing*/ };
    var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
    var pubsub = new RedisPubsub(client);
    var topic = pubsub.topic('test');
    topic.subscribe(handler);
  });

  it('should call the client "emit" method when publishing an event', function(done) {
    var client = {
      emit: function(topicName, topicData) {
        expect(topicName).to.equal('test');
        expect(topicData).to.deep.equal(data);
        done();
      }
    };
    var data = {test: true};
    var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
    var pubsub = new RedisPubsub(client);
    var topic = pubsub.topic('test');
    topic.publish(data);
  });
  
  it('should call the subscribed handlers when publishing an event', function(done) {
    var EventEmitter = require('events').EventEmitter;
    var client = new EventEmitter();
    var data = {test: true};
    var handler = function(topicData) {
      expect(topicData).to.deep.equal(data);
      done();
    };
    var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
    var pubsub = new RedisPubsub(client);
    var topic = pubsub.topic('test');
    topic.subscribe(handler);
    topic.publish(data);
  });
  
  it('should not call an unsubscribed handler', function(done) {
    var EventEmitter = require('events').EventEmitter;
    var client = new EventEmitter();
    var counter = 0;
    var data = {test: true};
    var handler1 = function() {
      counter++;
      if ( counter === 3 ) {
        throw new Error('The counter should equal 2');
      } else if ( counter === 2 ) {
        done();
      }
    };
    var handler3 = function() {
      counter++;
      if ( counter === 3 ) {
        throw new Error('The counter should equal 2');
      } else if ( counter === 2 ) {
        done();
      }
    };
    var handler2 = function() {
      counter++;
    };
    var RedisPubsub = require(BASEPATH+'/backend/core/pubsub/global/redis');
    var pubsub = new RedisPubsub(client);
    var topic = pubsub.topic('test');
    topic.subscribe(handler1);
    topic.subscribe(handler2);
    topic.subscribe(handler3);
    topic.unsubscribe(handler2);
    topic.publish(data);
  });
  
  
});