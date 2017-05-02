'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The AmqpClient class', function() {

  let helpers;
  let channel;

  function getInstanceOfAmqpClient(channel) {
    return new (helpers.requireBackend('core/amqp/client'))(channel);
  }

  beforeEach(function() {
    helpers = this.helpers;
    channel = {};
  });

  describe('The getClient method', function() {
    it('should set channel and _subscribeCallbackToConsumerTags', function() {
      var amqpClient = getInstanceOfAmqpClient(channel);

      expect(amqpClient.channel).to.deep.equal(channel);
      expect(amqpClient._subscribeCallbackToConsumerTags).to.be.instanceof(Map);
    });

    describe('the ack method', function() {
      it('should leverage channel.ack and set allUpTo to false by default', function() {
        channel.ack = sinon.spy();

        var message = {};

        getInstanceOfAmqpClient(channel).ack(message);

        expect(channel.ack).to.have.been.calledWith(message, false);
      });

      it('should leverage channel.ack and use the passed allUpTo when set to true', function() {
        channel.ack = sinon.spy();

        var message = {};

        getInstanceOfAmqpClient(channel).ack(message, true);

        expect(channel.ack).to.have.been.calledWith(message, true);
      });
    });
  });
});
