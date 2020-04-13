require('../../../backend/core/db/mongo');

const lib = require('./lib');
const middleware = require('./webserver/middleware');
let initialized = false;

module.exports = {
  lib,
  init
};

function init() {
  if (initialized) return;

  initialized = true;
  lib.registerCollaborationModule();
  middleware.registerActivityStreamMW();
}
