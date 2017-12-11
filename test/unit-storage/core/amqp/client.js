'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The amqp client', function() {

  let topic;
  let publishingMessage;
  let amqpConfig;
  let client;

  beforeEach(function(done) {
    amqpConfig = { url: this.testEnv.serversConfig.rabbitmq.url };
    mockery.registerMock('../../core/esn-config', () => ({ get: () => q.when(amqpConfig)}));
    topic = 'a topic';
    publishingMessage = { one: 'field', and: [{ an: 'array', as: 'message value'}] };

    this.helpers.requireBackend('core/amqp')
      .getClient().then(clientInstance => {
        client = clientInstance;
        done();
      })
      .catch(err => done(err || 'Cannot create the amqp client')).done();
  });

  afterEach(function(done) {
    client.dispose(() => done());
  });

  describe('when the amqp client is used for the pubsub pattern', function() {

    it('should make a subscriber getting a published message', function(done) {
      const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);

        done();
      };

      client.subscribe(topic, subscriber)
        .then(() => client.publish(topic, publishingMessage));
    });

    it('should make multiple subscribers getting the same published message', function(done) {
      let calledOnce = false;

      const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);
        calledOnce && done();
        calledOnce = true;
      };

      client.subscribe(topic, subscriber)
        .then(() => client.subscribe(topic, subscriber))
        .then(() => client.publish(topic, publishingMessage));
    });

    it('should make a subscriber able to get multiple published message', function(done) {
      let calledOnce = false;

      const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);
        calledOnce && done();
        calledOnce = true;
      };

      client.subscribe(topic, subscriber)
        .then(() => client.publish(topic, publishingMessage))
        .then(() => client.publish(topic, publishingMessage));
    });

    it('should make an unsubscribed handler unable to get published message anymore', function(done) {
      const considerTestOkTimeout = setTimeout(done, 500);
      const subscriber = () => {
        clearTimeout(considerTestOkTimeout);

        done('No call expected as I should be unsubscribed');
      };

      client.subscribe(topic, subscriber)
        .then(() => client.unsubscribe(topic, subscriber))
        .then(() => client.publish(topic, publishingMessage));
    });

    it('should unsubscribe all the handlers if they are the same', function(done) {
      const subscriber = () => {
        done('No call expected as I should be unsubscribed');
      };

      client.subscribe(topic, subscriber)
        .then(() => client.subscribe(topic, subscriber))
        .then(() => client.unsubscribe(topic, subscriber))
        .then(() => client.publish(topic, publishingMessage))
        .then(() => setTimeout(done, 500))
        .catch(err => done('Error' + err));
    });

    it('should make nothing when trying to unsubscribe an unknown handler', function(done) {
      client
        .unsubscribe(topic, () => {})
        .then(() => done());
    });

  });

  describe('when the amqp client is used for the topic pattern', function() {
    const options = {
      autoDelete: true
    };
    const exchange = 'exchange';
    const queue = 'queue';

    it('should make a consumer getting a published message', function(done) {
      const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);

        done();
      };

      client.assertExchange(exchange, 'topic')
        .then(() => client.assertQueue(queue, options))
        .then(() => client.assertBinding(queue, exchange))
        .then(() => client.consume(queue, options, subscriber))
        .then(() => client.send(exchange, publishingMessage))
        .catch(err => done(err || 'No reason'));
    });

    it('should make only one consumer getting a published message when multiple have been declared', function(done) {
      let considerTestOkTimeout;
      const subscriber = () => {
        if (considerTestOkTimeout) {
          clearTimeout(considerTestOkTimeout);

          done('Expecting only one message to be received');
        }
        considerTestOkTimeout = setTimeout(done, 1000);
      };

      client.assertExchange(exchange, 'topic')
        .then(() => client.assertQueue(queue, options))
        .then(() => client.assertBinding(queue, exchange))
        .then(() => client.consume(queue, { noAck: true }, subscriber))
        .then(() => client.consume(queue, { noAck: true }, subscriber))
        .then(() => client.send(exchange, publishingMessage))
        .catch(err => done(err || 'No reason'));
    });

    it('should the remaining consumer getting a published message when two have been declared but one has unsubscribed', function(done) {
      let considerTestOkTimeout;
      const subscriber = message => {
        expect(message).to.deep.equal(publishingMessage);
        considerTestOkTimeout = setTimeout(done, 500);
      };
      const unsubscribedSubscriber = () => {
        clearTimeout(considerTestOkTimeout);

        done('No call expected as I should be unsubscribed');
      };

      client.assertExchange(exchange, 'topic')
        .then(() => client.assertQueue(queue, options))
        .then(() => client.assertBinding(queue, exchange))
        .then(() => client.consume(queue, { noAck: true }, subscriber))
        .then(() => client.consume(queue, { noAck: true }, unsubscribedSubscriber))
        .then(() => client.unsubscribe('topic', unsubscribedSubscriber))
        .then(() => client.send(exchange, publishingMessage))
        .catch(err => done(err || 'No reason'));
    });

    it('should not parse message content when notOnlyJSONConsumer option is true', function(done) {
      const notOnlyJSONConsumer = true;
      const subscriber = message => {
        expect(JSON.parse(message)).to.deep.equal(publishingMessage);

        done();
      };

      client.assertExchange(exchange, 'topic')
        .then(() => client.assertQueue(queue, options))
        .then(() => client.assertBinding(queue, exchange))
        .then(() => client.consume(queue, options, subscriber, notOnlyJSONConsumer))
        .then(() => client.send(exchange, publishingMessage))
        .catch(err => done(err || 'No reason'));
    });

    it('should make the expected consumer getting a published message based on the routing key', function(done) {
      const otherQueue = 'otherQueue';
      const routingKey = 'routing.key.test';
      const routingPattern = 'routing.#';
      const otherRoutingPattern = 'other.routing.#';
      const expectingMessageConsumer = message => {
        expect(message).to.deep.equal(publishingMessage);

        done();
      };
      const notExpectingMessageConsumer = () => {
        done('No message expected in this consumer');
      };

      client.assertExchange(exchange, 'topic')
        .then(() => client.assertQueue(queue, options))
        .then(() => client.assertBinding(queue, exchange, routingPattern))
        .then(() => client.consume(queue, { noAck: true }, expectingMessageConsumer))
        .then(() => client.assertQueue(otherQueue, options))
        .then(() => client.assertBinding(otherQueue, exchange, otherRoutingPattern))
        .then(() => client.consume(otherQueue, { noAck: true }, notExpectingMessageConsumer))
        .then(() => client.send(exchange, publishingMessage, routingKey))
        .catch(err => done(err || 'No reason'));
    });

  });

  describe('the dispose method', function() {

    it('should be unable to publish any message when the client has been disposed', function(done) {
      client.dispose(() => {
        client.publish(topic, publishingMessage)
          .then(() => done('The client should be disposed'))
          .catch(() => done());
      });
    });

    it('should be unable to subscribe when the client has been disposed', function(done) {
      client.dispose(() => {
        client.subscribe(topic, () => {})
          .then(() => done('The client should be disposed'))
          .catch(() => done());
      });
    });

  });

});
