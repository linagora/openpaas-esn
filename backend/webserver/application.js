'use strict';

var express = require('express');
var cdm = require('connect-dynamic-middleware');
var i18n = require('../i18n');
var lessMiddleware = require('less-middleware');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');
var CSS_PATH = FRONTEND_PATH + '/css';
var config = require('../core').config('default');

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
application.set('views', FRONTEND_PATH + '/views');
application.set('view engine', 'jade');

application.use(lessMiddleware(
  FRONTEND_PATH,
  process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production.options : lessMiddlewareConfig.dev.options));
application.use('/css', express.static(CSS_PATH));

if (process.env.NODE_ENV !== 'test') {
  var morgan = require('morgan');
  application.use(morgan());
}

application.use('/components', express.static(FRONTEND_PATH + '/components'));
application.use('/images', express.static(FRONTEND_PATH + '/images'));
application.use('/js', express.static(FRONTEND_PATH + '/js'));

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
application.use(require('./middleware/setup-settings')());

application.use(flash());

application.locals.appName = config.app && config.app.name ? config.app.name : '';

require('./pubsub')(application);
require('./routes')(application);
