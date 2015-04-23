'use strict';

module.exports = function(dependencies, application) {
  var i18n = dependencies('i18n');
  application.use(i18n.init);
};
