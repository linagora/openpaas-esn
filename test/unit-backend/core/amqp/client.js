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

    describe('The comsume method', function() {
      let onMessageMock;

      beforeEach(function() {
        channel.ack = sinon.spy();
        channel.consume = (queue, onMessage) => {
          onMessageMock = originalMessage => onMessage(originalMessage);

          return Promise.resolve({});
        };
      });

      it('should send ack message when the callback is an asynchronous function', function(done) {
        const originalMessage = { content: 'foo' };
        const callback = sinon.stub().returns(Promise.resolve());

        getInstanceOfAmqpClient(channel).consume(null, {}, callback, true)
          .then(() => {
            onMessageMock(originalMessage)
              .then(() => {
                expect(channel.ack).to.have.been.calledWith(originalMessage, false);
                done();
              });
          })
          .catch(err => done(err || new Error('should resolve')));
      });

      it('should send ack message when the callback is not a synchronous function', function(done) {
        const originalMessage = { content: 'foo' };
        const callback = sinon.stub().returns();

        getInstanceOfAmqpClient(channel).consume(null, {}, callback, true)
          .then(() => {
            onMessageMock(originalMessage);
            expect(channel.ack).to.have.been.calledWith(originalMessage, false);
            done();
          })
          .catch(err => done(err || new Error('should resolve')));
      });
    });
  });
});
