'use strict';

function views(req, res) {
  var templateName = req.params[0].replace(/\.html$/, '');
  res.render(templateName);
}

module.exports.views = views;
