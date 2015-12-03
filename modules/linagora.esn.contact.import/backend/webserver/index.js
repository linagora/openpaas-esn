'use strict';

var express = require('express');
var application = require('./application');

module.exports = function(dependencies) {

  function getStaticApp(frontend_path) {
    var application = express();
    application.use(express.static(frontend_path));
    application.set('views', frontend_path + '/views');
    application.get('/views/*', function(req, res) {
      var templateName = req.params[0].replace(/\.html$/, '');
      res.render(templateName);
    });

    return application;
  }

  function getRootApp() {
    return application(dependencies);
  }

  return {
    getStaticApp: getStaticApp,
    getRootApp: getRootApp
  };
};
