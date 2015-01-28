'use strict';

var async = require('async');

module.exports = function(lib, dependencies) {

  var userModule = dependencies('user');

  function sendMessageAsEMail(from, user, message, callback) {
    var mail = dependencies('email');
    var data = {
      message: message.content,
      firstname: user.firstname,
      lastname: user.lastname
    };
    return mail.sendHTML(from, user.emails[0], message.title || 'New Message', 'new-message-notification', data, callback);
  }

  function sendResponseAsEmail(from, user, message, callback) {
    return callback(new Error('Not implemented'));
  }

  function generateReplyMessage(user, message, data) {
    return {
      content: message.body.text,
      author: user._id,
      source: 'email',
      attachments: message.attachments
    };
  }

  function getUsersForMessage(collaboration, message, options, callback) {
    async.map(collaboration.members, function(member, done) {
      return userModule.get(member.member.id, function(err, user) {
        if (!err && user) {
          return done(null, {
            user: user,
            member: member
          });
        }
        return done();
      });
    }, callback);
  }

  function getReplyObjectType() {
    return 'whatsup';
  }

  return {
    sendMessageAsEMail: sendMessageAsEMail,
    sendResponseAsEmail: sendResponseAsEmail,
    generateReplyMessage: generateReplyMessage,
    getUsersForMessage: getUsersForMessage,
    getReplyObjectType: getReplyObjectType
  };
};
