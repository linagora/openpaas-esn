'use strict';
var express = require('express');
var cdm = require('connect-dynamic-middleware');
var i18n = require('../i18n');
var lessMiddleware = require('less-middleware');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var frontendPath = path.normalize(__dirname + '/../../frontend');
var cssPath = frontendPath + '/css';

var lessMiddlewareConfig = {
  production: {
    options: {
      once: true
    }
  },
  dev: {
    options: {
      force: true,
      debug: true,
      compiler: {
        sourceMap: true
      }
    }
  }

};

var application = express();
exports = module.exports = application;
application.set('views', frontendPath + '/views');
application.set('view engine', 'jade');

application.use(lessMiddleware(
  frontendPath,
  process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production.options : lessMiddlewareConfig.dev.options));
application.use('/css', express.static(cssPath));
var morgan = require('morgan');
application.use(morgan());
application.use('/components', express.static(frontendPath + '/components'));
application.use('/images', express.static(frontendPath + '/images'));
application.use('/js', express.static(frontendPath + '/js'));

var bodyParser = require('body-parser');
application.use(bodyParser.json());
application.use(bodyParser.urlencoded());
var cookieParser = require('cookie-parser');
application.use(cookieParser('this is the secret!'));
var session = require('express-session');
var sessionMiddleware = cdm(session({ cookie: { maxAge: 60000 }}));
application.use(sessionMiddleware);
require('./middleware/setup-sessions')(sessionMiddleware);
application.use(i18n.init); // Should stand before app.route
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
