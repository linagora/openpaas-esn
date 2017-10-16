const { logger } = require('../../core');

class Pubsub {
  constructor(name, client) {
    this.name = name;
    this.client = client;
    this._channels = {};
    this._cache = [];
  }

  setClient(client) {
    if (this.client) {
      logger.warn('pubsub client already set');

      return;
    }
    this.client = client;
    this._cache.forEach(elem => this.topic(elem.topic)[elem.action](elem.data));
    delete this._cache;
  }

  _addCache(topic, action, data) {
    this._cache.push({ topic, action, data });
  }

  _createInterface(topic) {
    return {
      subscribe: handler => {
        if (!this.client) {
          return this._addCache(topic, 'subscribe', handler);
        }
        logger.debug(this.name + '/SUBSCRIBE to', topic);

        return this.client.on(topic, handler);
      },
      unsubscribe: handler => {
        if (!this.client) {
          return this._addCache(topic, 'unsubscribe', handler);
        }
        logger.debug(this.name + '/UNSUBSCRIBE to', topic);

        return this.client.removeListener(topic, handler);
      },
      publish: data => {
        if (!this.client) {
          return this._addCache(topic, 'publish', data);
        }

        return this.client.emit(topic, data);
      },
      forward: (pubsub, data) => {
        if (pubsub instanceof Pubsub) {
          this._channels[topic].publish(data);

          return pubsub.topic(topic).publish(data);
        }
        throw new Error('Invalid pubsub to forward to');
      }
    };
  }

  topic(name) {
    if (!(name in this._channels)) {
      this._channels[name] = this._createInterface(name);
    }

    return this._channels[name];
  }
}

module.exports = Pubsub;
