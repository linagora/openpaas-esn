'use strict';

module.exports = (dependencies, application) => application.use(require('../../lib/i18n')(dependencies).init);
