'use strict';

function views(req, res, next) {
  var templateName = req.params[0].replace(/\.html$/, '');
  res.render(templateName);
}
module.exports.views = views;

