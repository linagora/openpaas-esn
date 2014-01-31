'use strict';

function views(req, res, next) {
  res.render(req.params[0]);
}
module.exports.views = views;

