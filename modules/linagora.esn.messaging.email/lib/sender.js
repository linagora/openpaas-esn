'use strict';

var async = require('async');
var DEFAULT_DOMAIN = 'localhost';
var rules = [];
var fs = require('fs');

module.exports = function(lib, dependencies) {

  var logger = dependencies('logger');

  function addSenderRule(name, fn) {
    if (!fn) {
      return;
    }
    rules.push({
      name: name,
      rule: fn
    });
  }

  function initRules(callback) {
    fs.readdirSync(__dirname + '/rules').forEach(function(filename) {
      var stat = fs.statSync(__dirname + '/rules/' + filename);
      if (!stat.isFile()) { return; }
      var name = filename.split('.')[0];
      logger.debug('Initializing rule %s', name);
      var rule = require('./rules/' + filename)(lib, dependencies);
      addSenderRule(name, rule);
    });
    return callback();
  }

  function getUsers(members, callback) {

    var userModule = dependencies('user');

    async.filter(members, function(member, callback) {
      return callback(member.member.objectType === 'user');
    }, function(members) {
      var result = [];
      async.forEach(members, function(member, callback) {
        userModule.get(member.member.id, function(err, user) {
          if (err) {
            logger.info('Error while getting user', err);
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

  function sendMessageAsEmails(message, users, callback) {
    if (!message) {
      return callback(new Error('Message is required'));
    }

    if (!users) {
      return callback(new Error('Users are required'));
    }

    async.forEach(users, function(user, callback) {
      notify(user, message, function(err, sent) {
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

  function listen() {

    initRules(function() {
      var pubsub = dependencies('pubsub').local;
      pubsub.topic('message:activity').subscribe(function(activity) {

        if (!rules || rules.length === 0) {
          logger.debug('No rules to apply to message');
          return;
        }

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

          var recipients = [];

          function addRecipients(members) {
            if (!members || members.length === 0) {
              return;
            }

            function equals(a, b) {
              return a.member.id + '' === b.member.id + '' && a.member.objectType === b.member.objectType;
            }

            function isIn(array, element) {
              for (var i = 0; i < array.length; i++) {
                if (equals(array[i], element)) {
                  return true;
                }
              }
              return false;
            }

            members.forEach(function(member) {
              if (!isIn(recipients, member)) {
                recipients.push(member);
              }
            });
          }

          function getRuleConfig(name, callback) {
            if (!name) {
              return callback(new Error('Can not get config from undefined rule name'));
            }

            var esnconfig = dependencies('esn-config');

            esnconfig('mail').get('rules', function(err, data) {
              if (err) {
                return callback(err);
              }

              if (!data || !data[name]) {
                return callback(null, {active: false});
              }

              return callback(null, data[name]);
            });
          }

          function applyRules(collaboration, callback) {
            async.forEach(rules, function(rule, done) {
              getRuleConfig(rule.name, function(err, config) {
                if (err) {
                  logger.debug('Error while getting rule %s config: Error %e', rule.name, err);
                  return done();
                }

                if (!config || !config.active) {
                  logger.debug('Rule "%s" is not configured or not active', rule.name);
                  return done();
                }

                rule.rule(collaboration, message, config.options || {}, function(err, members) {
                  if (err) {
                    logger.info('Error while applying the rule %s', err.message);
                  }

                  if (members && members.length > 0) {
                    addRecipients(members);
                  } else {
                    logger.debug('The rule does not add members to the recipients list');
                  }
                  return done();
                });
              });
            }, callback);
          }

          async.forEach(activity.target, function(target, callback) {
            collaborationModule.findCollaborationFromActivityStreamID(target._id, function(err, collaboration) {
              if (err) {
                logger.info('Error while loading collaboration %s', err.message);
              }

              if (!collaboration) {
                logger.info('Can not get any collaboration');
              }

              if (!err && collaboration) {
                return applyRules(collaboration[0], callback);
              } else {
                return callback();
              }
            });
          }, function(err) {

            if (err) {
              logger.info('Error while applying rules %s', err.message);
              return;
            }

            getUsers(recipients, function(err, users) {
              if (err) {
                return logger.info('Can not get users %s', err.message);
              }

              if (!users) {
                return logger.info('Can not get users from recipients', recipients);
              }

              sendMessageAsEmails(message, users, function(err) {
                if (err) {
                  return logger.info('Can not send message as email %s', err.message);
                }
                logger.info('Message has been sent has email');
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
    notify: notify,
    addSenderRule: addSenderRule
  };

};
