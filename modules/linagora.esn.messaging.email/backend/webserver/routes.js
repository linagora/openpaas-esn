'use strict';

function routes(app, lib, dependencies) {

  var mw = require('./middleware')(dependencies, lib);
  var controllers = require('./controllers')(dependencies, lib);

  app.get('/api/messages/email/reply/check', mw.loadUser, mw.canReplyTo, function(req, res) {
    return res.status(200).end();
  });
  app.post('/api/messages/email/reply', mw.loadUser, mw.canReplyTo, controllers.replyMessageFromEmail);
}

module.exports = routes;
