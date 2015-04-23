'use strict';

module.exports = function(dependencies, application) {
  var i18n = require('../../lib/i18n')(dependencies);
  application.use(i18n.init);
};
