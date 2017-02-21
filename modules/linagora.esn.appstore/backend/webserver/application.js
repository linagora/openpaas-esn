'use strict';

const path = require('path');
const express = require('express');

const FRONTEND_PATH = path.join(__dirname, '../../frontend');
const VIEW_PATH = FRONTEND_PATH + '/views';

module.exports = function(appManager, dependencies) {
  const i18n = require('../lib/i18n')(dependencies);

  const app = express();

  app.use(i18n.init);
  app.use(express.static(FRONTEND_PATH));
  app.set('views', VIEW_PATH);

  function views(req, res) {
    const templateName = req.params[0].replace(/\.html$/, '');

    return res.render(templateName);
  }
  app.get('/views/*', views);

  const appstore = require('./routes/appstore')(appManager, dependencies);

  app.use('/', appstore);

  return app;
};
