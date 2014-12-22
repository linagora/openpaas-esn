'use strict';

var FROM_HEADER = 'esn-email-to-reply-from';
var TO_HEADER = 'esn-email-to-reply-to';

module.exports = function(dependencies, lib) {

  function canReplyTo(req, res, next) {
    var to = req.query.to || req.headers[TO_HEADER];
    if (!to) {
      return res.json(400, {error: {status: 400, message: 'Bad Request', details: 'to query parameter is required'}});
    }

    lib.getReplyTo(to, function(err, tuple) {
      if (err) {
        return res.json(500, {error: {status: 500, message: 'Server Error', details: err.details}});
      }

      if (!tuple) {
        return res.json(404, {error: {status: 404, message: 'Not found', details: 'Can not get message from recipient address'}});
      }

      lib.canReply(req.user, tuple, function(err, reply) {
        if (err) {
          return res.json(500, {error: {status: 500, message: 'Server Error', details: err.details}});
        }
        if (!reply) {
          return res.json(403, {error: {status: 403, message: 'Forbidden', details: 'User does not have enough rights to reply to the message'}});
        }
        req.message = tuple;
        return next();
      });
    });
  }

  function loadUser(req, res, next) {
    var user = req.query.user || req.headers[FROM_HEADER];

    if (!user) {
      return res.json(400, {error: {status: 400, message: 'Bad Request', details: 'User query parameter is required'}});
    }

    lib.getUser(user, function(err, u) {
      if (err) {
        return res.json(500, {error: {status: 500, message: 'Server Error', details: err.details}});
      }

      if (!u) {
        return res.json(404, {error: {status: 404, message: 'Not found', details: 'No such user ' + user}});
      }
      req.user = u;
      next();
    });
  }

  return {
    loadUser: loadUser,
    canReplyTo: canReplyTo
  };

};
