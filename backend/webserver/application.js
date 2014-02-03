'use strict';
var express = require('express');
var i18n = require('../i18n');
var lessMiddleware = require('less-middleware');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var frontendPath = path.normalize(__dirname + '/../../frontend');
var cssPath = frontendPath + '/css';

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
application.use('/components', express.static(frontendPath + '/components'));
application.use('/images', express.static(frontendPath + '/images'));
application.use('/js', express.static(frontendPath + '/js'));

application.use(i18n.init); // Should stand before app.route
application.use(express.json());
application.use(express.urlencoded());
application.use(express.cookieParser('this is the secret!'));
application.use(express.session({ cookie: { maxAge: 60000 }}));
require('./passport');

application.use(passport.initialize());
application.use(passport.session());

application.use(function(req, res, next) {
  // put the user in locals
  // so they it can be used directly in template
  res.locals.user = req.user;
  next();
});

application.use(flash());
require('./routes')(application);
