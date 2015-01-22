'use strict';

var async = require('async');
var DEFAULT_DOMAIN = 'localhost';

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

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
    var handlers = lib.handlers;

    if (!handlers[message.objectType]) {
      return callback(new Error('No email handler for %s message', message.objectType));
    }

    return handlers[message.objectType].sendMessageAsEMail(from, user, message, callback);
  }

  function notify(user, message, data, callback) {

    if (!user) {
      return callback(new Error('User is required'));
    }

    if (!message) {
      return callback(new Error('Message is required'));
    }

    var tokenData = {
      user: user,
      message: {
        objectType: message.objectType,
        id: message._id
      }
    };

    if (data) {
      tokenData.data = data;
    }

    lib.token.generateToken(tokenData, function(err, token) {
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

  function sendMessageAsEmails(message, recipients, callback) {
    if (!message) {
      return callback(new Error('Message is required'));
    }

    if (!recipients) {
      return callback(new Error('Recipients are required'));
    }

    async.forEach(recipients, function(recipient, callback) {
      var user = recipient.user;
      var data = recipient.data;

      notify(user, message, data, function(err, sent) {
        if (err) {
          logger.info('Can not notify user %s: %s', user._id, err.message);
          return;
        }
        logger.info('Email has been sent to user %s', user._id);
        callback();
      });
    }, function(err) {
      if (err) {
        logger.info('Error occurred while sending mail messages', err.message);
      } else {
        logger.info('Messages have been sent by email');
      }
      callback(err);
    });
  }

  function getResolverConfig(name, callback) {
    if (!name) {
      return callback(new Error('Can not get config from undefined resolver name'));
    }

    var esnconfig = dependencies('esn-config');

    esnconfig('mail').get('resolvers', function(err, data) {
      if (err) {
        return callback(err);
      }

      if (!data || !data[name]) {
        return callback(null, {active: false});
      }

      return callback(null, data[name]);
    });
  }

  function getMessageTargets(collaboration, message, callback) {
    var handlers = lib.handlers;
    var type = message.objectType;

    var handler = handlers[type];
    if (!handler) {
      return callback(new Error('Can not any handler for %s message', type));
    }

    getResolverConfig(type, function(err, config) {
      if (err) {
        logger.debug('Error while getting resolver %s config: Error %e', type, err);
        return callback();
      }

      if (!config || !config.active) {
        logger.debug('Handler "%s" is not configured or not active', type);
        return callback();
      }

      handler.getUsersForMessage(collaboration, message, config.options || {}, function(err, result) {
        if (err) {
          logger.info('Error while getting user data %e', err);
        }

        return callback(null, result);
      });
    });
  }

  function listen() {

    var pubsub = dependencies('pubsub').local;
    pubsub.topic('message:activity').subscribe(function(activity) {

      var messageModule = dependencies('message');
      var collaborationModule = dependencies('collaboration');
      var messageTuple = activity.object;

      messageModule.get(messageTuple._id, function(err, message) {
        if (err) {
          logger.info('Can not load message %s', err.message);
          return;
        }

        if (!message) {
          logger.info('Can not find message');
          return;
        }

        async.concat(activity.target, function(target, callback) {
          collaborationModule.findCollaborationFromActivityStreamID(target._id, function(err, collaboration) {
            if (err) {
              logger.info('Error while loading collaboration %s', err.message);
            }

            if (!collaboration) {
              logger.info('Can not get any collaboration');
            }

            if (!err && collaboration) {
              return getMessageTargets(collaboration[0], message, function(err, targets) {
                return callback(null, targets);
              });
            } else {
              return callback(null, []);
            }
          });
        }, function(err, recipients) {

          if (err) {
            logger.info('Error while applying rules %s', err.message);
            return;
          }

          if (!recipients || recipients.length === 0) {
            logger.info('No recipients found for message');
            return;
          }

          sendMessageAsEmails(message, recipients, function(err) {
            if (err) {
              return logger.info('Can not send message as email %s', err.message);
            }
            logger.info('Message has been sent has email');
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
