const express = require('express');
const {
  FRONTEND_PATH,
  CORE_FRONTEND_PATH
} = require('../constants');

module.exports = (dependencies, application) => {
  application.use(express.static(FRONTEND_PATH));
  application.set('views', `${FRONTEND_PATH}/app`);
  application.get('/app/*', function(req, res) {
    const templateName = req.params[0].replace(/\.html$/, '');

    res.render(templateName, { basedir: `${CORE_FRONTEND_PATH}/views` });
  });
};
