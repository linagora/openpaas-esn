'use strict';

function Pubsub(client) {
  this.client = client;
  this._channels = {};
}

Pubsub.prototype._createInterface = function(topic) {
  var self = this;
  return {
    subscribe: function(handler) {
      self.client.on(topic, handler);
    },
    unsubscribe: function(handler) {
      self.client.removeListener(topic, handler);
    },
    publish: function(data) {
      self.client.emit(topic, data);
    }
  };
};

Pubsub.prototype.topic = function(name) {
  if ( ! (name in this._channels) ) {
    this._channels[name] = this._createInterface(name);
  }
  return this._channels[name];
};

module.exports = Pubsub;