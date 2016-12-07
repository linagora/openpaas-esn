'use strict';

var q = require('q');
var esnConfig = require('../esn-config')('mail');
var mailSenderBuilder = require('./mail-sender');

function getMailer(user) {
  var mailSenderPromise = getMailSender(user);

  function send(type) {
    var args = Array.prototype.slice.call(arguments, 1);
    var callback = args.length ? args[args.length - 1] : null;

    if (typeof callback !== 'function') {
      callback = null;
    }

    return mailSenderPromise.then(function(mailSender) {
        return q.npost(mailSender, type, args);
      })
      .then(function(data) {
        callback && callback(null, data);

        return data;
      })
      .catch(function(err) {
        callback && callback(err);

        return q.reject(err);
      });
  }

  return {
    send: send.bind(null, 'send'),
    sendHTML: send.bind(null, 'sendHTML')
  };
}

function getMailSender(user) {
  return getMailConfig(user).then(mailSenderBuilder);
}

function getMailConfig(user) {
  return esnConfig.forUser(user).get().then(function(data) {
    if (!data) {
      return q.reject(new Error('mail is not configured'));
    }

    return data;
  });
}

module.exports = {
  getMailer: getMailer,
  mailSenderBuilder: mailSenderBuilder,
  system: require('./system')
};
