const express = require('express');
const i18n = require('../i18n');
const path = require('path');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const FRONTEND_PATH = path.normalize(__dirname + '/../../frontend');
const config = require('../core').config('default');
const logger = require('../core').logger;
const startupBuffer = require('./middleware/startup-buffer')(config.webserver.startupBufferTimeout);
const cookieParser = require('cookie-parser');
const staticAssets = require('./middleware/static-assets');
const sessionSetup = require('./session');
const pubsubSetup = require('./pubsub');
const routesSetup = require('./routes');
const passportSetup = require('./passport');
const requestLoggerMiddleware = require('./middleware/request-logger');

const application = express();

exports = module.exports = application;

application.set('views', [FRONTEND_PATH + '/views', FRONTEND_PATH + '/js']);
application.set('view engine', 'pug');

var morgan = require('morgan');
var format = 'combined';

if (process.env.NODE_ENV === 'dev') {
  format = 'dev';
}
application.use(morgan(format, { stream: logger.stream }));

application.use(requestLoggerMiddleware);

staticAssets(application, '/images', FRONTEND_PATH + '/images');
staticAssets(application, '/components', FRONTEND_PATH + '/components');
application.use('/js', express.static(FRONTEND_PATH + '/js', { extensions: ['js']}));
application.use('/core/js', express.static(FRONTEND_PATH + '/js/modules', { extensions: ['js']}));

application.use(bodyParser.json());
application.use(bodyParser.urlencoded({ extended: true }));

application.use(startupBuffer);
application.use(cookieParser());
application.use(sessionSetup());

application.use(i18n.init); // Should stand before app.route

application.use((req, res, next) => {
  // put the user in locals
  // so they it can be used directly in template
  res.locals.user = req.user;
  next();
});

application.use(flash());

application.locals.appName = config.app && config.app.name ? config.app.name : '';

application.use((req, res, next) => {
  req.logging.log('bootstrap completed');
  next();
});

passportSetup(application);

application.use((req, res, next) => {
  req.logging.log('authentication completed');
  next();
});

pubsubSetup(application);
routesSetup(application);

application.use((err, req, res, next) => {
  logger.error('Unhandled error on Core Express Server', err.stack);
  next(err);
});
