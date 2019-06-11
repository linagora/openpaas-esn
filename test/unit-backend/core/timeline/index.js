'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var sinon = require('sinon');
var q = require('q');

describe('The timeline module', function() {

  beforeEach(function() {
    mockery.registerMock('./denormalizer', {
      init: function() {}
    });
  });

  describe('The registerUserStreamHandlers function', function() {

    it('should add the timeline entry when a valid event is received on the topic', function(done) {
      var localstub = {};
      var spy = sinon.spy();
      var topic = 'foo:bar:baz';
      var entry = {
        foo: 'bar',
        baz: 'qix'
      };

      mockery.registerMock('../activitystreams', {
        addTimelineEntry: function(_entry) {
          expect(_entry).to.deep.equal(entry);
          expect(spy).to.have.been.called;
          done();
        }
      });

      var handler = function() {
        spy();
        return q(entry);
      };

      this.helpers.mock.pubsub('../pubsub', localstub, {});

      var module = this.helpers.requireBackend('core/timeline');
      module.registerUserStreamHandlers(topic, [handler]);
      expect(localstub.topics[topic].handler).to.be.a.function;
      localstub.topics[topic].handler(entry);
    });
  });
});
