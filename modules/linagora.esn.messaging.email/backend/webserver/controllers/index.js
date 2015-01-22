'use strict';

var async = require('async');

module.exports = function(dependencies, lib) {

  function getUser(req, res) {
    if (!req.user) {
      return res.json(404, {error: {code: 404, message: 'Not found', details: 'User not found'}});
    }

    return res.json(200, req.user);
  }

  function replyMessageFromEmail(req, res) {

    var user = req.user;
    var replyTo = req.replyTo;

    if (!user || !replyTo) {
      return res.json(400, {error: {code: 400, message: 'Bad request', details: 'User or message data not found'}});
    }

    async.waterfall([
      function(callback) {
        lib.parseMessage(req, user, callback);
      },
      function(message, callback) {
        lib.reply(message, req.replyTo, user, callback);
      }
    ], function(err, result) {
      if (err) {
        return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return res.json(201, result);
    });
  }

  return {
    replyMessageFromEmail: replyMessageFromEmail,
    getUser: getUser
  };
};
