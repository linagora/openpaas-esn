'use strict';

require('../../all');

var expect = require('chai').expect;

describe('The core local pubsub module', function() {
  var pubsub = null;
  var counter;

  beforeEach(function() {
    counter = 0;
    pubsub = require(this.testEnv.basePath + '/backend/core').pubsub.local;
  });


  it('should fire the subscribed callbacks when an event is published', function(done) {
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
    function handler1() {
      counter++;
    }

    var topic = pubsub.topic('test');
    topic.unsubscribe(handler1);
  });

});
