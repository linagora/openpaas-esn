'use strict';

module.exports = (dependencies, application) => {
  const i18nLib = require('../../lib/i18n')(dependencies);

  application.use(i18nLib.i18n.init);
};
