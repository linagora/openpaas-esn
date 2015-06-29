'use strict';

// cf https://github.com/nodejitsu/node-http-proxy/blob/master/examples/middleware/bodyDecoder-middleware.js
// cf https://github.com/nodejitsu/node-http-proxy/issues/496

module.exports = function() {
  return function(req, res, next) {
    req.removeAllListeners('data');
    req.removeAllListeners('end');
    next();
    process.nextTick(function() {
      if (req.body) {
        req.emit('data', JSON.stringify(req.body));
      }
      req.emit('end');
    });
  };
};
