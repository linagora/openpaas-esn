const pubsub = require('../pubsub').global;
const { clearCache } = require('./css');
const { UPDATED_TOPIC_NAME } = require('./constants');

module.exports = {
  init
};

function init() {
  pubsub.topic(UPDATED_TOPIC_NAME).subscribe(({ domainId }) => clearCache(domainId));
}
