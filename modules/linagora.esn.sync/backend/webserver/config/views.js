'use strict';

const FRONTEND_PATH = require('../constants').FRONTEND_PATH;

module.exports = (dependencies, application) => {
  application.use(require('express').static(FRONTEND_PATH));
  application.set('views', FRONTEND_PATH + '/app');
  application.get('/app/*', (req, res) => res.render(req.params[0].replace(/\.html$/, '')));
};
