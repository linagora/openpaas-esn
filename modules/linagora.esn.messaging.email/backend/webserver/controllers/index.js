'use strict';

var async = require('async');

module.exports = function(dependencies, lib) {

  function getUser(req, res) {
    if (!req.user) {
      return res.json(404, {error: {status: 404, message: 'Not found', details: 'User not found'}});
    }

    return res.json(200, req.user);
  }

  function replyMessageFromEmail(req, res) {

    var user = req.user;
    var tuple = req.message;

    if (!user || !tuple) {
      return res.json(400, {error: {status: 400, message: 'Bad request', details: 'User or message tuple not found'}});
    }

    async.waterfall([
      function(callback) {
        lib.parseMessage(req, callback);
      },
      function(message, callback) {
        lib.reply(message, tuple, user, callback);
      }
    ], function(err, result) {
      if (err) {
        return res.json(500, {error: {status: 500, message: 'Server Error', details: err.message}});
      }
      return res.json(201, result);
    });
  }

  return {
    replyMessageFromEmail: replyMessageFromEmail,
    getUser: getUser
  };
};
