'use strict';

var ObjectId = require('mongoose').Types.ObjectId;

module.exports.requireQueryParams = function(/* ...params */) {
  var params = arguments;
  return function(req, res, next) {
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      if (!(param in req.query)) {
        return res.json(400, { error: 400, message: 'Parameter missing', details: param });
      }
    }
    return next();
  };
};

module.exports.requireBody = function(req, res, next) {
  if (!req.body) {
    return res.json(400, { error: 400, message: 'Bad Request', details: 'Missing data in body' });
  }
  return next();
};

module.exports.castParamToObjectId = function(/* ...params */) {
  var params = arguments;
  return function(req, res, next) {
    for (var i = 0; i < params.length; i++) {
      var param = params[i];
      if (!(param in req.params)) {
        return res.json(400, { error: 400, message: 'Parameter missing', details: param });
      }

      var id;
      try {
        id = new ObjectId(req.params.user_id);
      } catch (err) {
        return res.json(400, {error: {code: 400, message: 'Bad request', details: 'not a valid ObjectId (' + param + ')'}});
      }
      req.params[param] = id;
    }
    return next();
  };
};
