const logger = require('../../core/logger');
const { EXCHANGE_TYPES } = require('./constants');
const { dataAsBuffer } = require('./utils');

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
    const self = this;

    return self.channel.consume(queue, onMessage, options)
      .then(res => self._registerNewConsumerTag(callback, res.consumerTag));

    function onMessage(originalMessage) {
      const result = callback(notOnlyJSONConsumer ? originalMessage.content : JSON.parse(originalMessage.content), originalMessage);

      if (result && result.then && typeof result.then === 'function') {
        return result.then(() => self.ack(originalMessage));
      }

      return self.ack(originalMessage);
    }
  }

  _registerNewConsumerTag(callback, consumerTag) {
    const sameCallbackTags = this._subscribeCallbackToConsumerTags.get(callback) || [];

    sameCallbackTags.push(consumerTag);
    this._subscribeCallbackToConsumerTags.set(callback, sameCallbackTags);

    logger.info('AMQP: A new consumer has been created: ' + consumerTag);
  }
}

module.exports = AmqpClient;
