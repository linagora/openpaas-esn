'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;

describe('The AMQP pubsub client', function() {
  let helpers;

  function getClient(channel) {
    return new (helpers.requireBackend('core/amqp/pubsubclient'))(channel);
  }

  beforeEach(function() {
    helpers = this.helpers;
  });

  describe('The subscribeToDurableQueue function', function() {
    it('should call channel methods correctly', function(done) {
      const queueName = 'durablequeue';
      const exchangeName = 'exchangeName';
      const callback = () => {};
      const channel = {
        assertExchange: sinon.stub().returns(Promise.resolve()),
        assertQueue: sinon.stub().returns(Promise.resolve()),
        bindQueue: sinon.stub().returns(Promise.resolve()),
        consume: sinon.stub().returns(Promise.resolve({consumerTag: '1'}))
      };
      const client = getClient(channel);

      client.subscribeToDurableQueue(exchangeName, queueName, callback).then(() => {

      expect(channel.assertExchange).to.have.been.calledWith(exchangeName, 'fanout');
      expect(channel.assertQueue).to.have.been.calledWith(queueName, {
        exclusive: false,
        durable: true,
        autoDelete: false
      });
      expect(channel.bindQueue).to.have.been.calledWith(queueName, exchangeName);
      expect(channel.consume).to.have.been.calledWith(queueName, sinon.match.func, { noAck: false });
      done();
      });
    });
  });
});
