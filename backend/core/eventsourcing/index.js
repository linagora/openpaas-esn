const pubsub = require('./pubsub');

module.exports = {
  init,
  pubsub
};

function init() {
  pubsub.init();
}
