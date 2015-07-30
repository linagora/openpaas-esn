'use strict';

var logger = require('../../core').logger;

function Pubsub(name, client) {
  this.name = name;
  this.client = client;
  this._channels = {};
  this._cache = [];
}

Pubsub.prototype.setClient = function(client) {
  if (this.client) {
    logger.warn('pubsub client already set');
    return;
  }
  this.client = client;
  var self = this;
  this._cache.forEach(function(elem) {
    self.topic(elem.topic)[elem.action](elem.data);
  });
  delete this._cache;
};

Pubsub.prototype._addCache = function(topic, action, data) {
  this._cache.push(
    {
      topic: topic,
      action: action,
      data: data
    }
  );
};

Pubsub.prototype._createInterface = function(topic) {
  var self = this;
  return {
    subscribe: function(handler) {
      if (!self.client) {
        return self._addCache(topic, 'subscribe', handler);
      }
      logger.debug(self.name + '/SUBSCRIBE to', topic);
      self.client.on(topic, handler);
    },
    unsubscribe: function(handler) {
      if (!self.client) {
        return self._addCache(topic, 'unsubscribe', handler);
      }
      logger.debug(self.name + '/UNSUBSCRIBE to', topic);
      self.client.removeListener(topic, handler);
    },
    publish: function(data) {
      if (!self.client) {
        return self._addCache(topic, 'publish', data);
      }
      logger.debug(self.name + '/PUBLISH into', topic, 'DATA', data);
      self.client.emit(topic, data);
    },
    forward: function(pubsub, data) {
      if (pubsub instanceof Pubsub) {
        self._channels[topic].publish(data);
        pubsub.topic(topic).publish(data);
        return;
      }
      throw new Error('Invalid pubsub to forward to');
    }
  };
};

Pubsub.prototype.topic = function(name) {
  if (! (name in this._channels)) {
    this._channels[name] = this._createInterface(name);
  }
  return this._channels[name];
};

module.exports = Pubsub;
