'use strict';

module.exports = function(dependencies, application) {
  const i18n = require('../../lib/i18n')(dependencies);

  application.use(i18n.init);
};
