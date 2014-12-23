'use strict';

var async = require('async');
var DEFAULT_DOMAIN = 'localhost';

module.exports = function(lib, dependencies) {

  function getUsers(message, stream, callback) {
    // get the users who wants to receive emails for the given message and stream

    var collaborationModule = dependencies('collaboration');
    var userModule = dependencies('user');

    collaborationModule.findCollaborationFromActivityStreamID(stream._id, function(err, collaboration) {
      if (err) {
        return callback(err);
      }
      if (!collaboration || collaboration.length === 0) {
        return callback(new Error('Can not find valid collaboration for stream ' + stream));
      }

      async.filter(collaboration[0].members, function(member, callback) {
        return callback(member.member.objectType === 'user');
      }, function(members) {

        var result = [];
        async.forEach(members, function(member, callback) {
          userModule.get(member.member.id, function(err, user) {
            if (err) {
              console.log('Error while getting user', err);
            }
            if (user) {
              result.push(user);
            }
            return callback();
          });
        }, function() {
          return callback(null, result);
        });
      });
    });
  }

  function getSenderAddress(emailtoken, callback) {
    if (!emailtoken || !emailtoken.token) {
      return callback(new Error('Valid Token is required'));
    }
    var domain = DEFAULT_DOMAIN;
    var esnconfig = dependencies('esn-config');

    esnconfig('mail').get(function(err, data) {
      if (!err && data && data.mail && data.mail.reply && data.mail.reply.domain) {
        domain = data.mail.reply.domain;
      }

      var email = emailtoken.token + '@' + domain;
      if (data && data.mail && data.mail.reply && data.mail.reply.name) {
        email = data.mail.reply.name + ' <' + email + '>';
      }

      return callback(null, email);
    });
  }

  function sendMail(from, user, message, callback) {
    var mail = dependencies('email');
    var data = {
      message: message.content,
      firstname: user.firstname,
      lastname: user.lastname
    };
    return mail.sendHTML(from, user.emails[0], 'New message', 'new-message-notification', data, callback);
  }

  function notify(user, message, callback) {

    if (!user) {
      return callback(new Error('User is required'));
    }

    if (!message) {
      return callback(new Error('Message is required'));
    }

    lib.token.generateToken({
      user: user,
      message: {
        objectType: message.objectType,
        id: message._id
      }
    }, function(err, token) {
      if (err) {
        return callback(err);
      }

      getSenderAddress(token, function(err, sender) {
        if (err) {
          return callback(err);
        }
        sendMail(sender, user, message, callback);
      });
    });
  }

  function listen() {
    var pubsub = dependencies('pubsub').local;
    pubsub.topic('message:activity').subscribe(function(activity) {

      var messageModule = dependencies('message');
      var messageTuple = activity.object;

      // TODO :get the user which sent the message to avoid to send him the email...

      messageModule.get(messageTuple._id, function(err, message) {
        if (err) {
          return;
        }

        async.forEach(activity.target, function(target) {
          getUsers(message, target, function(err, users) {
            if (err) {
              return;
            }

            async.forEach(users, function(user) {
              notify(user, message, function(err, sent) {
                if (err) {
                  return;
                }
                console.log('SENT MAIL', sent);
              });
            });
          });
        });
      });
    });
  }

  return {
    listen: listen,
    sendMail: sendMail,
    notify: notify
  };

};
