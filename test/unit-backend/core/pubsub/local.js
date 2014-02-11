'use strict';

var expect = require('chai').expect;
var BASEPATH = '../../../..';

describe('The core local pubsub module', function() {

  it('should fire the subscribed callbacks when an event is published', function(done) {
    var pubsub = require(BASEPATH + '/backend/core').pubsub.local;
    var counter = 0;
    function handler1() {
      counter++;
    }
    function handler2() {
      counter++;
    }

    var topic = pubsub.topic('test');
    topic.subscribe(handler1);
    topic.subscribe(handler2);
    topic.subscribe(handler1);
    topic.publish('test');
    process.nextTick(function() {
      expect(counter).to.equal(3);
      done();
    });
  });

  it('should allow unsubscribing subscribed callbacks', function(done) {
    var pubsub = require(BASEPATH + '/backend/core').pubsub.local;
    var counter = 0;
    function handler1() {
      counter++;
    }
    function handler2() {
      counter++;
    }

    var topic = pubsub.topic('test');
    topic.subscribe(handler1);
    topic.subscribe(handler2);
    topic.subscribe(handler1);
    topic.unsubscribe(handler1);
    topic.publish('test');
    process.nextTick(function() {
      expect(counter).to.equal(1);
      done();
    });
  });

  it('should forgive unsubscribing a not subscribed callback', function() {
    var pubsub = require(BASEPATH + '/backend/core').pubsub.local;
    var counter = 0;
    function handler1() {
      counter++;
    }

    var topic = pubsub.topic('test');
    topic.unsubscribe(handler1);
  });

});
