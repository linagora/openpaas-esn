const Pubsub = require('../pubsub');
const { EventEmitter } = require('events');
const emitter = new EventEmitter();
const removeListener = emitter.removeListener;

emitter.removeListener = function(event, handler) {
  let count = this.listeners(event).length;
  let countAfterRemove = 0;

  while (count !== countAfterRemove) {
    count = countAfterRemove;
    removeListener.call(this, event, handler);
    countAfterRemove = this.listeners(event).length;
  }
};

module.exports = new Pubsub('local', emitter);
