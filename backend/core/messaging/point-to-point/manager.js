const { logger } = require('../../../core');

const noop = () => {};

class PointToPointMessagingChannelManager {
  constructor(client) {
    this.client = client;
    this._channels = {};
    this._sendBuffer = [];
    this._receiversCache = [];
    this._receiversPromisesBuffer = [];
  }

  get(name) {
    logger.debug(`PointToPointMessagingManager: Get channel='${name}'`);

    if (!(name in this._channels)) {
      this._channels[name] = this._createChannel(name);
    }

    return this._channels[name];
  }

  setClient(client) {
    if (!client) {
      return Promise.reject(new Error('PointToPointMessagingManager: Client is undefined'));
    }

    if (this.client) {
      logger.warn('PointToPointMessagingManager: Client already set. Overriding');
    }

    this.client = client;

    return this._bindReceivers()
      .then(() => this._sendBufferedMessages())
      .then(() => {
        this._receiversPromisesBuffer.forEach(promise => promise());
        this._receiversPromisesBuffer = [];
        this._sendBuffer = [];
      })
      .catch(err => logger.error('PointToPointMessagingManager: Error creating receivers', err));
  }

  unsetClient(callback = noop) {
    const oldClient = this.client;

    this.client = undefined;

    if (oldClient) {
      try {
        oldClient.dispose(callback);
      } catch (e) {
        logger.debug('PointToPointMessagingManager: Error while closing client', e);
      }
    } else {
      callback();
    }
  }

  _createChannel(channel) {
    return {
      send: message => {
        if (!this.client) {
          return this._addMessageToBuffer(channel, message);
        }

        return this.client.publish(channel, message);
      },
      receive: receiver => {
        const wrappedReceiver = this._wrapReceiver(channel, receiver);

        this._addReceiverToCache(channel, wrappedReceiver);

        if (!this.client) {
          return new Promise(resolve => {
            this._receiversPromisesBuffer.push(() => resolve(wrappedReceiver));
          });
        }

        return this._bindReceiver(channel, wrappedReceiver).then(() => wrappedReceiver);
      },
      unsubscribe: handler => {
        this._removeReceiverFromCache(channel, handler);

        if (this.client) {
          logger.debug(`PointToPointMessagingManager: Unsubscribe from channel=${channel}`);

          return this.client.unsubscribe(channel, handler);
        }
      }
    };
  }

  _addMessageToBuffer(channel, message) {
    this._sendBuffer.push({ channel, message });
  }

  _addReceiverToCache(channel, receiver) {
    this._receiversCache.push({ channel, receiver });
  }

  _removeReceiverFromCache(channel, receiver) {
    this._receiversCache = this._receiversCache.filter(entry => (entry.channel !== channel || entry.receiver !== receiver));
  }

  _bindReceiver(channel, receiver) {
    logger.debug(`PointToPointMessagingManager: Subscribe to channel='${channel}'`);

    return this.client.subscribeToDurableQueue(channel, channel, receiver);
  }

  _bindReceivers() {
    return Promise.all(this._receiversCache.map(receiver => this._bindReceiver(receiver.channel, receiver.receiver)));
  }

  _sendBufferedMessages() {
    return this._sendBuffer.forEach(send => this.get(send.channel).send(send.message));
  }

  _wrapReceiver(channel, receiver = noop) {
    return (jsonMessage, originalMessage) => {
      logger.debug(`PointToPointMessagingManager: Received message on channel='${channel}', sending to handler`);

      receiver(jsonMessage, {
        ack: () => { this.client.ack(originalMessage); }
      });
    };
  }
}

module.exports = PointToPointMessagingChannelManager;
