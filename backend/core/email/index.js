'use strict';

var q = require('q');
var domainConfig = require('../domain-config');
var logger = require('../logger');
var esnConfig = require('../esn-config')('mail');
var mailSenderBuilder = require('./mail-sender');

function getMailer(domainId) {
  var mailSenderPromise = getMailSender(domainId);

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

function getMailSender(domainId) {
  return getMailConfig(domainId).then(mailSenderBuilder);
}

function getMailConfig(domainId) {
  // fallback to esn-config
  if (!domainId) {
    return q.ninvoke(esnConfig, 'get');
  }

  return domainConfig.get(domainId, 'mail').catch(function(err) {
    logger.info('Failed to get mail configuration of domain %s, falling back to ESN config: %s', domainId, err.message);

    return q.ninvoke(esnConfig, 'get');
  });
}

module.exports = {
  getMailer: getMailer
};
