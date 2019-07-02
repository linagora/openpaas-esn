const express = require('express');

module.exports = (lib, dependencies) => {
  const authorizationMW = dependencies('authorizationMW');
  const app = express();

  app.use(authorizationMW.requiresAPILogin);
  lib.init().then(() => app.use('/ui', lib.kue.app));

  return app;
};
