'use strict';

module.exports = function(dependencies, application) {
  var i18nLib = require('../../lib/i18n')(dependencies);
  application.use(i18nLib.i18n.init);
};
