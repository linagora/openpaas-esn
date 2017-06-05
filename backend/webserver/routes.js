'use strict';

var authorize = require('./middleware/authorization');
var config = require('../core').config('default');
var cors = require('cors');
var startupBuffer = require('./middleware/startup-buffer')(config.webserver.startupBufferTimeout);
const { ssoStrategies } = require('../core/passport');

exports = module.exports = function(application) {
  application.all('/api/*', cors({origin: true, credentials: true}));

  application.use(startupBuffer);
  application.use(require('./middleware/modules'));

  var oauth2 = require('../oauth2');
  application.get('/oauth/authorize', authorize.loginAndContinue, oauth2.authorization, oauth2.dialog);
  application.post('/oauth/authorize/decision', authorize.requiresAPILogin, oauth2.decision);
  application.post('/oauth/token', oauth2.token);

  var loginController = require('./controllers/login');
  var users = require('./controllers/users');
  application.get('/login', ssoStrategies.middleware, loginController.index);
  application.get('/logout', users.logout);
  application.get('/passwordreset', authorize.requiresJWT, loginController.passwordResetIndex);

  var invitation = require('./controllers/invitation');
  application.get('/invitation/signup', invitation.signup);
  application.get('/invitation/:uuid', invitation.load, invitation.confirm);

  var views = require('./controllers/views');
  var templates = require('./middleware/templates');
  application.get('/views/*', templates.alterViewsFolder, views.views);
  application.get(/\/js\/.*\.html/, templates.alterViewsFolder, views.views);

  require('./middleware/setup-routes')(application);
  var resourceLinks = require('./middleware/resource-link');
  resourceLinks.addCanCreateMiddleware('like', require('./middleware/message').canLike);

  var home = require('./controllers/home');
  application.get('/', authorize.loginAndContinue, home.index);

  var cssController = require('./controllers/css');
  application.get('/generated/css/:app/:foo.css', cssController.getCss);

  var generatedJavascript = require('./controllers/generated-javascript');
  application.get('/js/constants.js', generatedJavascript.constants);
  application.get('/generated/jsApp/:appName/app/:namespace', generatedJavascript.jsApp);
  application.get('/generated/js/:appName/js/:namespace', generatedJavascript.js);

  var apiModule = require('./api');
  apiModule.setupAPI(application);
};
