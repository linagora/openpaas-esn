'use strict';

var i18n = require('i18n');

module.exports.getAll = function(req, res) {
  return res.json(200, ['en', 'fr']);
};

module.exports.get = function(req, res) {
  return res.json(200, i18n.getLocale());
};

module.exports.set = function(req, res) {
  res.cookie('locale', req.params.locale);
  i18n.setLocale(req.params.locale);
  res.redirect(200, 'back');
};
