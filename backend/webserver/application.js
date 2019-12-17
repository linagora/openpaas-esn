'use strict';

var express = require('express');
var i18n = require('../i18n');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');
var config = require('../core').config('default');
var logger = require('../core').logger;
const startupBuffer = require('./middleware/startup-buffer')(config.webserver.startupBufferTimeout);
const cookieParser = require('cookie-parser');
const staticAssets = require('./middleware/static-assets');
const session = require('./session');

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

staticAssets(application, '/images', FRONTEND_PATH + '/images');
staticAssets(application, '/components', FRONTEND_PATH + '/components');
application.use('/js', express.static(FRONTEND_PATH + '/js', { extensions: ['js']}));
application.use('/core/js', express.static(FRONTEND_PATH + '/js/modules', { extensions: ['js']}));

var bodyParser = require('body-parser');
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({
  extended: true
}));

application.use(startupBuffer);
application.use(cookieParser());

application.use(session());

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

application.use((err, req, res, next) => {
  logger.error('Unhandled error on Core Express Server', err.stack);
  next(err);
});
