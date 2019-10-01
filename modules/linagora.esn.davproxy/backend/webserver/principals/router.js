const express = require('express');

module.exports = dependencies => {
  const router = express.Router();
  const proxy = require('../proxy')(dependencies)('principals');
  const davMiddleware = dependencies('davserver').davMiddleware;

  router.all('/*', davMiddleware.getDavEndpoint, proxy.handle());

  return router;
};
