'use strict';

var q = require('q');
var ICAL = require('ical.js');
var jcalHelper = require('../helpers/jcal');
var contentSender;
var helpers;
var pubsub;
var logger;
var cron;

function _sendAlarmEmail(ics, email) {
  var defer = q.defer();

  helpers.config.getBaseUrl(function(err, baseUrl) {
    if (err) {
      return defer.reject(err);
    }

    var event;
    try {
      event = jcalHelper.jcal2content(ics, baseUrl);
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

function _registerNewAlarm(date, ics, email, context) {
  function job(callback) {
    logger.info('Try sending event alarm email to', email);
    _sendAlarmEmail(ics, email).then(function() {
      callback();
    }, callback);
  }

  function onComplete() {
    logger.info('Succesfully computed event alarm email for', email);
  }

  cron.submit('Will send an event alarm once at ' + date.toString() + ' to ' + email, date, job, context, onComplete, function(err, job) {
    if (err) {
      logger.error('Error while submitting the job send alarm email', err);
    } else {
      logger.info('Job send alarm email has been submitted', job);
    }
  });
}

function _onCreate(msg) {
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

  var alarm = jcalHelper.getVAlarmAsObject(valarm, vevent.getFirstPropertyValue('dtstart'));
  var context = {
    alarmDueDate: alarm.alarmDueDate,
    attendee: alarm.attendee,
    eventUid: vevent.getFirstPropertyValue('uid'),
    action: alarm.action
  };
  logger.info('Register new event alarm email for', alarm.email, 'at', alarm.alarmDueDate.clone().local().format());
  _registerNewAlarm(alarm.alarmDueDate.toDate(), vcalendar.toString(), alarm.email, context);
}

function _onDelete(msg) {
  var vcalendar = new ICAL.Component(msg.event);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var eventUid = vevent.getFirstPropertyValue('uid');

  cron.abortAll({
    eventUid: eventUid
  }, function(err) {
    if (err) {
      logger.error('Error while deleting all the job for event ' + eventUid, err);
    } else {
      logger.info('All jobs about event ' + eventUid + ' have been deleted.');
    }
  });
}

function _onUpdate(msg) {
  var vcalendar = new ICAL.Component(msg.old_event);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var eventUid = vevent.getFirstPropertyValue('uid');
  var valarm = vevent.getFirstSubcomponent('valarm');

  var abortFunction = valarm ? function(callback) {
    var alarm = jcalHelper.getVAlarmAsObject(valarm, vevent.getFirstPropertyValue('dtstart'));
    cron.abortAll({
      eventUid: eventUid,
      attendee: alarm.attendee
    }, callback);
  } : function(callback) {
    return callback();
  };

  abortFunction(function(err) {
    if (err) {
      return logger.error('Error while deleting all the job for event ' + eventUid, err);
    } else {
      _onCreate(msg);
    }
  });
}

function _handleAlarm(msg) {
  switch (msg.type) {
    case 'created':
      _onCreate(msg);
      break;
    case 'updated':
      _onUpdate(msg);
      break;
    case 'deleted':
      _onDelete(msg);
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
