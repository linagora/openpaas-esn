'use strict';

module.exports = function(lib, dependencies) {

  function sendMessageAsEMail(from, user, message, callback) {
    var mail = dependencies('email');
    var data = {
      message: message.content,
      firstname: user.firstname,
      lastname: user.lastname
    };
    return mail.sendHTML(from, user.emails[0], message.title || 'New Org Message', 'new-orgmessage-notification', data, callback);
  }

  function sendResponseAsEmail(from, user, message, callback) {
    return callback(new Error('Not implemented'));
  }

  function replyFromEMail(message, callback) {
    return callback(new Error('Not implemented'));
  }

  return {
    sendMessageAsEMail: sendMessageAsEMail,
    sendResponseAsEmail: sendResponseAsEmail,
    replyFromEMail: replyFromEMail
  };
};

