'use strict';

const logger = require('../../core/logger');
const q = require('q');

const EXCHANGE_TYPES = {
  pubsub: 'fanout',
  topic: 'topic'
};

const PUBSUB_EXCHANGE = {
  type: EXCHANGE_TYPES.pubsub,
  routingKey: '', // not considered for 'fanout' exchange
  encoding: 'utf8'
};

const SUBSCRIBER = {
  queueName: undefined, // This is the pubsub pattern with amqp, the server allocates a free queue name for us
  queueOptions: {
    exclusive: true,
    durable: false,
    autoDelete: true
  },
  consumeOptions: { noAck: false }
};

const dataAsBuffer = data => Buffer.from(JSON.stringify(data), PUBSUB_EXCHANGE.encoding);

// see http://www.squaremobius.net/amqp.node/ for the amqp documentation
class AmqpClient {

  constructor(channel) {
    this.channel = channel;
    this._subscribeCallbackToConsumerTags = new Map();
  }

  dispose(callback) {
    logger.info('AMQP: closing the connection');

    return this.channel.connection.close(callback);
  }

  publish(topic, data) {
    logger.debug('AMQP: publishing message to:', topic);

    return this.assertExchange(topic, PUBSUB_EXCHANGE.type)
    .then(() => this.send(topic, data, PUBSUB_EXCHANGE.routingKey));
  }

  subscribe(topic, callback) {
    return this.assertExchange(topic, PUBSUB_EXCHANGE.type)
      .then(() => this.assertQueue(SUBSCRIBER.queueName, SUBSCRIBER.queueOptions))
      .then(res => this.assertBinding(res.queue, topic).then(() => res))
      .then(res => this.consume(res.queue, SUBSCRIBER.consumeOptions, callback));
  }

  unsubscribe(topic, callback) {
    const consumerTags = this._subscribeCallbackToConsumerTags.get(callback);

    if (Array.isArray(consumerTags)) {
      logger.info('AMQP: About removing the consumer(s): ' + consumerTags);

      return q.all(consumerTags.map(c => this.channel.cancel(c)));
    }

    logger.warn('AMQP: No consumerTag found to unsubscribe a consumer from: ' + topic);

    return q.when();
  }

  assertExchange(exchange, type = EXCHANGE_TYPES.topic) {
    return this.channel.assertExchange(exchange, type);
  }

  ack(message, allUpTo = false) {
    return this.channel.ack(message, allUpTo);
  }

  assertQueue(name, options) {
    return this.channel.assertQueue(name, options);
  }

  assertBinding(queue, exchange, routingPattern) {
    return this.channel.bindQueue(queue, exchange, routingPattern);
  }

  send(exchange, data, routingKey = '') {
    return this.channel.publish(exchange, routingKey, dataAsBuffer(data));
  }

  consume(queue, options, callback, notOnlyJSONConsumer = false) {

    function onMessage(originalMessage) {
      callback(notOnlyJSONConsumer ? originalMessage.content : JSON.parse(originalMessage.content), originalMessage);
    }

    return this.channel.consume(queue, onMessage, options)
      .then(res => this._registerNewConsumerTag(callback, res.consumerTag));
  }

  _registerNewConsumerTag(callback, consumerTag) {
    const sameCallbackTags = this._subscribeCallbackToConsumerTags.get(callback) || [];

    sameCallbackTags.push(consumerTag);
    this._subscribeCallbackToConsumerTags.set(callback, sameCallbackTags);

    logger.info('AMQP: A new consumer has been created: ' + consumerTag);
  }
}

module.exports = AmqpClient;
