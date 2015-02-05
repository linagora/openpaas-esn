'use strict';

var expect = require('chai').expect;

describe('The pubsub object', function() {

  var localstub, globalstub, localpubsub, globalpubsub, topic;

  beforeEach(function() {
    var PubSub = this.helpers.requireBackend('core/pubsub/pubsub');
    localstub = {};
    globalstub = {};
    localpubsub = new PubSub();
    topic = localpubsub.topic('topic');
    globalpubsub = new PubSub();
  });

  it('should forward data to specified pubsub', function() {
    topic.forward(globalpubsub, { data: 'data'});

    expect(localpubsub._cache[0]).to.deep.equal({
      topic: 'topic',
      action: 'publish',
      data: {
        data: 'data'
      }
    });
    expect(localpubsub._cache.length).to.equal(1);
    expect(globalpubsub._cache[0]).to.deep.equal({
      topic: 'topic',
      action: 'publish',
      data: {
        data: 'data'
      }
    });
    expect(globalpubsub._cache.length).to.equal(1);
  });

  it('should fail when forwarding to specified not supported pubsub', function() {
    try {
      localpubsub.forward({}, { data: 'data'});
    } catch (e) {
      return;
    }
    throw new Error('should not fail');
  });
});
