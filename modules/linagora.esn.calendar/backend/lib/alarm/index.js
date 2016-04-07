'use strict';

var q = require('q');
var contentSender;
var helpers;
var jcal2content = require('../helpers/jcal').jcal2content;

function sendAlarmEmail(ics, email) {
  var defer = q.defer();

  helpers.config.getBaseUrl(function(err, baseUrl) {
    if (err) {
      return defer.reject(err);
    }

    var event;
    try {
      event = jcal2content(ics, baseUrl);
    } catch (err) {
      return defer.reject(err);
    }

    var alarm = event.alarm;
    var from = { objectType: 'email', id: 'noreply@open-paas.org' };
    var to = { objectType: 'email', id: email };
    var options = {
      template: 'event.alarm',
      message: {
        subject: alarm.summary
      }
    };
    var content = {
      baseUrl: baseUrl,
      event: event,
      alarm: alarm
    };

    contentSender.send(from, to, content, options, 'email').then(defer.resolve, defer.reject);
  });

  return defer.promise;
}

module.exports = function(dependencies) {
  helpers = dependencies('helpers');
  contentSender = dependencies('content-sender');

  return {
    sendAlarmEmail: sendAlarmEmail
  };
};
