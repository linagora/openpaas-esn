const pubsub = require('./pubsub');

module.exports = {
  init,
  pubsub
};

function init() {
  // disabled, see https://ci.linagora.com/linagora/lgs/openpaas/esn/issues/2309
  // pubsub.init();
}
