'use strict';

var async = require('async');

module.exports = function(dependencies, lib) {

  function getUser(req, res) {
    if (!req.user) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'User not found'}});
    }

    return res.status(200).json(req.user);
  }

  function replyMessageFromEmail(req, res) {

    var user = req.user;
    var replyTo = req.replyTo;

    if (!user || !replyTo) {
      return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'User or message data not found'}});
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
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
      }
      return res.status(201).json(result);
    });
  }

  return {
    replyMessageFromEmail: replyMessageFromEmail,
    getUser: getUser
  };
};
