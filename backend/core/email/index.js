'use strict';

const Q = require('q');
const esnConfig = require('../esn-config')('mail');
const mailSenderBuilder = require('./mail-sender');

module.exports = {
  getMailer,
  mailSenderBuilder,
  system: require('./system')
};

function getMailer(user) {
  const mailSenderPromise = getMailSender(user);

  return {
    send: send.bind(null, 'send'),
    sendHTML: send.bind(null, 'sendHTML'),
    sendWithCustomTemplateFunction: sendUsingNativePromise('sendWithCustomTemplateFunction')
  };

  function sendUsingNativePromise(type) {
    return function() {
      return mailSenderPromise
        .then(mailSender => mailSender[type].apply(null, arguments));
    };
  }

  // TODO: Refactor this code and the related code to use native Promise instead of Q.
  function send(type) {
    const args = Array.prototype.slice.call(arguments, 1);
    let callback = args.length ? args[args.length - 1] : null;

    if (typeof callback !== 'function') {
      callback = null;
    }

    return mailSenderPromise
      .then(mailSender => Q.npost(mailSender, type, args))
      .then(data => {
        callback && callback(null, data);

        return data;
      })
      .catch(err => {
        callback && callback(err);

        return Q.reject(err);
      });
  }
}

function getMailSender(user) {
  return getMailConfig(user).then(mailSenderBuilder);
}

function getMailConfig(user) {
  return esnConfig.forUser(user).get()
    .then(data => {
      if (!data) {
        return Q.reject(new Error('mail is not configured'));
      }

      return data;
    });
}
