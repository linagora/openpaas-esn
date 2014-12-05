'use strict';

var logger = require('../../core').logger;

function moduleHooks(req, res, next) {
  function jsonHook(code, json) {
    var specificRoute = 'route:' + req.method.toLowerCase() + ':' + req.route.path;
    var webserver = require('../index').webserver;
    var hookargs = arguments;

    // Handle res.status(200).json({})
    if (arguments.length === 1) {
      json = code;
      hookargs = [json];
    }

    webserver.emit(specificRoute, [req, res, json], function() {
      webserver.emit('route', [req, res, json], function(err) {
        if (err) {
          logger.error('An ESN module triggered an error while hooking ' +
                       req.route.path + ': ' + err);
        }
        realjson.apply(res, hookargs);
      });
    });
  }

  var realjson = res.json;
  res.json = jsonHook;
  next();
}
module.exports = moduleHooks;
