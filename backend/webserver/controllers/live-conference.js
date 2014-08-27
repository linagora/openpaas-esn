'use strict';

var i18n = require('../../i18n');

module.exports.open = function(req, res) {
  return res.render('live-conference/index', {
    title: i18n.__('Conference')
  });
};
