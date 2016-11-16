'use strict';

const logger = require('../../core/logger');
const q = require('q');

const PUBSUB_EXCHANGE = {
  type: 'fanout',
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
  consumeOptions: { noAck: true }
};

const dataAsBuffer = data => Buffer.from(JSON.stringify(data), PUBSUB_EXCHANGE.encoding);

class AmqpClient {

  constructor(channel) {
    this.channel = channel;
    this._subscribeCallbackToConsumerTag = new Map();
  }

  dispose(callback) {
    logger.info('AMQP: closing the connection');

    return this.channel.connection.close(callback);
  }

  publish(topic, data) {
    logger.debug('AMQP: publishing message to:', topic);

    return this.channel.assertExchange(topic, PUBSUB_EXCHANGE.type)
      .then(() => this.channel.publish(topic, PUBSUB_EXCHANGE.routingKey, dataAsBuffer(data)));
  }

  subscribe(topic, callback) {
    return this.channel.assertExchange(topic, PUBSUB_EXCHANGE.type)
      .then(() => this.channel.assertQueue(SUBSCRIBER.queueName, SUBSCRIBER.queueOptions))
      .then(res => this.channel.bindQueue(res.queue, topic).then(() => res))
      .then(res => this.channel.consume(res.queue, msg => callback(JSON.parse(msg.content)), SUBSCRIBER.consumeOptions))
      .then(res => {
        this._subscribeCallbackToConsumerTag.set(callback, res.consumerTag);
        logger.info('AMQP: A new consumer has been created: ' + res.consumerTag);
      });
  }

  unsubscribe(topic, callback) {
    const consumerTag = this._subscribeCallbackToConsumerTag.get(callback);

    if (consumerTag) {
      logger.info('AMQP: About removing the consumer: ' + consumerTag);

      return this.channel.cancel(consumerTag);
    }

    logger.warn('AMQP: No consumerTag found to unsubscribe a consumer from: ' + topic);

    return q.when();
  }

  // aliases to fit the EventEmitter API
  emit(topic, data) {
    return this.publish(topic, data);
  }

  on(topic, callback) {
    return this.subscribe(topic, callback);
  }

  removeListener(topic, callback) {
    return this.unsubscribe(topic, callback);
  }

}

module.exports = AmqpClient;
