'use strict';

var q = require('q');
var contentSender;
var helpers;
var jcal2content = require('../helpers/jcal').jcal2content;
var ICAL = require('ical.js');
var pubsub;
var logger;
var moment = require('moment');
var cron;

function _sendAlarmEmail(ics, email) {
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

function _registerNewAlarm(date, ics, email) {
  function job(callback) {
    logger.info('Try sending event alarm email to', email);
    _sendAlarmEmail(ics, email).then(function() {
      callback();
    }, callback);
  }

  function onComplete() {
    logger.info('Succesfully sent event alarm email to', email);
  }

  cron.submit('Will send an event alarm once at ' + date.toString() + ' to ' + email, date, job, onComplete, function(err, job) {
    if (err) {
      logger.error('Error while submitting the job send alarm email', err);
    } else {
      logger.info('Job send alarm email has been submitted', job);
    }
  });
}

function _icalDateToMoment(icalDate) {
  var dt;
  var momentDatetimeArg = [icalDate.year, icalDate.month - 1, icalDate.day, icalDate.hour, icalDate.minute, icalDate.second];

  if (icalDate.isDate) {
    dt = moment(momentDatetimeArg.slice(0, 3));
  } else if (icalDate.zone === ICAL.Timezone.utcTimezone) {
    dt = moment.utc(momentDatetimeArg);
  } else {
    dt = moment(momentDatetimeArg);
  }

  return dt;
}

function _handleAlarm(msg) {
  switch (msg.type) {
    case 'created':
      var vcalendar = new ICAL.Component(msg.event);
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      var valarm = vevent.getFirstSubcomponent('valarm');

      if (!valarm) {
        logger.debug('No alarm: doing nothing for', msg);
        return;
      }

      var action = valarm.getFirstPropertyValue('action');
      if (action !== 'EMAIL') {
        logger.warn('VALARM not supported: doing nothing for', msg, 'and action', action);
        return;
      }

      var trigger = valarm.getFirstPropertyValue('trigger');
      var attendee = valarm.getFirstPropertyValue('attendee');
      var startDate = _icalDateToMoment(vevent.getFirstPropertyValue('dtstart'));
      var date = startDate.clone().add(moment.duration(trigger));
      var email = attendee.replace(/^MAILTO:/i, '');
      logger.info('Register new event alarm email for', email, 'at', date.clone().local().format());
      _registerNewAlarm(date.toDate(), vcalendar.toString(), email);
      break;
    case 'updated':
      logger.warn('Handling alarm and event modification is not supported yet');
      break;
    case 'deleted':
      logger.warn('Handling alarm and event deletion is not supported yet');
      break;
  }
}

function init() {
  pubsub.local.topic('calendar:event:updated').subscribe(_handleAlarm);
}

module.exports = function(dependencies) {
  helpers = dependencies('helpers');
  contentSender = dependencies('content-sender');
  pubsub = dependencies('pubsub');
  cron = dependencies('cron');
  logger = dependencies('logger');

  return {
    init: init
  };
};
