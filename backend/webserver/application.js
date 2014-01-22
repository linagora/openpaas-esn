'use strict';
var express = require('express');
var i18n = require('../i18n');
var lessMiddleware = require('less-middleware');
var path = require('path');
var frontendPath = path.normalize(__dirname + '/../../frontend');
var cssPath = frontendPath + '/css';
var fs = require('fs');

var lessMiddlewareConfig = {
  production: {
    src: frontendPath,
    once: true
  },
  dev: {
    src: frontendPath,
    force: true,
    debug: true,
    sourceMap: true
  }
};


var application = express();
exports = module.exports = application;
application.set('views', frontendPath + '/views');
application.set('view engine', 'jade');

application.use(lessMiddleware(
  process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production : lessMiddlewareConfig.dev
));
application.use('/css', express.static(cssPath));
application.use(express.logger());
application.use(express.static(frontendPath + '/components'));

application.use(i18n.init); // Should stand before app.route
application.use(express.json());


// special route middleware to map the setup wizard template and API
require('./middleware/setup-routes')(application);

// load the routes from the routes folder
var routes = __dirname + '/routes';
fs.readdirSync(routes).forEach(function(file) {
  require(routes + '/' + file)(application);
});

