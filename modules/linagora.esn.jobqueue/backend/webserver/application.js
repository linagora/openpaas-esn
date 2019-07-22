const express = require('express');

module.exports = (lib, dependencies) => {
  const application = express();

  require('./config/i18n')(dependencies, application);
  require('./config/views')(dependencies, application);

  application.use(require('./api/routes')(lib, dependencies));
  application.use(require('./api/kue')(lib, dependencies));

  return application;
};
