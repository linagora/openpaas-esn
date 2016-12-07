'use strict';

module.exports = function(dependencies, application) {
  application.use(require('../../lib/i18n')(dependencies).init);
};
