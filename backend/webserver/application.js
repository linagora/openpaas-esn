'use strict';

var express = require('express');
var cdm = require('connect-dynamic-middleware');
var i18n = require('../i18n');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');
var config = require('../core').config('default');
var logger = require('../core').logger;

var application = express();
exports = module.exports = application;

application.set('views', [FRONTEND_PATH + '/views', FRONTEND_PATH + '/js']);
application.set('view engine', 'pug');

var morgan = require('morgan');
var format = 'combined';

if (process.env.NODE_ENV === 'dev') {
  format = 'dev';
}
application.use(morgan(format, { stream: logger.stream }));

application.use('/components', express.static(FRONTEND_PATH + '/components'));
application.use('/images', express.static(FRONTEND_PATH + '/images'));
application.use('/js', express.static(FRONTEND_PATH + '/js', { extensions: ['js']}));
application.use('/core/js', express.static(FRONTEND_PATH + '/js/modules', { extensions: ['js']}));

var bodyParser = require('body-parser');
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({
  extended: true
}));

var session = require('express-session');
var sessionMiddleware = cdm(session({
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 6000000 },
  secret: 'this is the secret!'
}));
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

application.locals.appName = config.app && config.app.name ? config.app.name : '';

require('./pubsub')(application);
require('./routes')(application);
