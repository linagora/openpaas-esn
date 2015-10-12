'use strict';

var GRACE_PERIOD = 10000;
var FACTOR = 2;

module.exports = function(dependencies) {

  var tokenMW = dependencies('tokenMW');

  function generateNewToken(req, res, next) {
    return tokenMW.generateNewToken(req.query.graceperiod ? req.query.graceperiod * FACTOR : GRACE_PERIOD)(req, res, next);
  }

  // Due to the issue about raw-body, bodyParser and restreamer, we might want
  // to remove content-length header because the body might be changed in this
  // proxy before forwarding
  function removeContentLength(req, res, next) {
    if (req.headers) {
      delete req.headers['content-length'];
    }
    next();
  }

  return {
    generateNewToken: generateNewToken,
    removeContentLength: removeContentLength
  };
};
