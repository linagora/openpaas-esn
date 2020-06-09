
module.exports = {
  DEFAULT_AMQP_PROTOCOL: 'amqp',
  DEFAULT_AMQP_HOST: 'localhost',
  DEFAULT_AMQP_PORT: '5672',
  DEFAULT_AMQP_USERNAME: 'guest',
  DEFAULT_AMQP_PASSWORD: 'guest',
  DEFAULT_AMQP_HTTP_HOST: 'localhost',
  DEFAULT_AMQP_HTTP_PORT: '15672',
  DEFAULT_AMQP_HTTP_PROTOCOL: 'http',

  EXCHANGE_TYPES: {
    pubsub: 'fanout',
    topic: 'topic'
  },

  PUBSUB_EXCHANGE: {
    type: 'fanout',
    routingKey: '', // not considered for 'fanout' exchange
    encoding: 'utf8'
  },

  SUBSCRIBER: {
    queueName: undefined, // This is the pubsub pattern with amqp, the server allocates a free queue name for us
    queueOptions: {
      exclusive: true,
      durable: false,
      autoDelete: true
    },
    durableQueueOptions: {
      exclusive: false,
      durable: true,
      autoDelete: false
    },
    consumeOptions: { noAck: false }
  }
};
