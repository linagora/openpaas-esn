/**
 * Provides point to point messaging as defined in http://www.enterpriseintegrationpatterns.com/patterns/messaging/PointToPointChannel.html
 *
 * A Point-to-Point Channel ensures that only one receiver consumes any given message.
 * If the channel has multiple receivers, only one of them can successfully consume a particular message.
 * If multiple receivers try to consume a single message, the channel ensures that only one of them succeeds, so the receivers do not have to coordinate with each other.
 * The channel can still have multiple receivers to consume multiple messages concurrently, but only a single receiver consumes any one message.
 *
 * The AMQP implementation also ensures that messages are durable and consumed once receivers are up,
 * even if messages were published by other components while no receiver was up.
 */

const logger = require('../../').logger;
const PointToPointMessagingChannelManager = require('./manager');
const manager = new PointToPointMessagingChannelManager();
const localPubsub = require('../../pubsub').local;
const amqpDisconnectedTopic = localPubsub.topic('amqp:disconnected');
const amqpClientTopic = localPubsub.topic('amqp:client:available');

amqpDisconnectedTopic.subscribe(() => {
  logger.debug('PointToPointMessaging: Unset AMQP Client');
  manager.unsetClient();
});

amqpClientTopic.subscribe(client => {
  logger.debug('PointToPointMessaging: Set AMQP Client');
  manager.setClient(client);
});

module.exports = manager;
