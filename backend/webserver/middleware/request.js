'use strict';

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
