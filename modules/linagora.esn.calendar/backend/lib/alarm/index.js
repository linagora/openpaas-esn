'use strict';

var q = require('q');
var ICAL = require('ical.js');
var moment = require('moment-timezone');
var jcalHelper = require('../helpers/jcal');
var constants = require('../constants');
var emailModule;
var helpers;
var pubsub;
var logger;
var cron;
var i18nLib;
var userModule;

function _sendAlarmEmail(ics, email) {
  return q.nfbind(userModule.findByEmail)(email)
    .then(user => q.all([
        q.nfcall(helpers.config.getBaseUrl, null),
        i18nLib.getI18nForMailer(user)
      ])
    )
    .spread((baseUrl, i18nConf) => {
      const event = jcalHelper.jcal2content(ics, baseUrl);
      const message = {
        to: email,
        subject: event.alarm.summary
      };
      const templateName = 'event.alarm';

      return emailModule.getMailer().sendHTML(message, templateName, {
        content: {
          baseUrl: baseUrl,
          event: event,
          alarm: event.alarm
        },
        translate: i18nConf.translate
      });
    }).catch(err => {
      logger.error('Could not send alarm email', err);
    });
}

function _registerNewAlarm(context, dbStorage) {
  function job(callback) {
    logger.info('Try sending event alarm email to', context.email);
    _sendAlarmEmail(context.ics, context.email).then(function() {
      callback();
    }, callback);
  }

  var alarmDueDate = moment(context.alarmDueDate).toDate();
  cron.submit('Will send an event alarm once at ' + alarmDueDate.toString() + ' to ' + context.email, alarmDueDate, job, context, {dbStorage: dbStorage}, function(err, job) {
    if (err) {
      logger.error('Error while submitting the job send alarm email', err);
    } else {
      logger.info('Job send alarm email has been submitted', job);
    }
  });
}

function _registerNewReccuringAlarm(context, dbStorage) {
  function job(callback) {
    logger.info('Try sending event alarm email to', context.email);
    _sendAlarmEmail(context.ics, context.email).then(function() {
      var vcalendar = ICAL.Component.fromString(context.ics);
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      var valarm = vevent.getFirstSubcomponent('valarm');
      var trigger = valarm.getFirstPropertyValue('trigger');
      var triggerDuration = moment.duration(trigger);

      var expandStart = moment().add(triggerDuration).format();
      expandStart = new Date(expandStart);
      expandStart = new Date(expandStart.getTime() + 60000);
      expandStart = new ICAL.Time.fromDateTimeString(expandStart.toISOString());
      var expand = new ICAL.RecurExpansion({
        component: vevent,
        dtstart: expandStart
      });
      var nextInstance = expand.next();

      if (nextInstance) {
        context.alarmDueDate = moment(nextInstance.clone()).add(triggerDuration).format();
        _registerNewReccuringAlarm(context, dbStorage);
      }

      callback();
    }, callback);
  }
  var alarmDueDate = moment(context.alarmDueDate).toDate();
  cron.submit('Will send an event alarm once at ' + alarmDueDate.toString() + ' to ' + context.email, alarmDueDate, job, context, {dbStorage: dbStorage}, function(err, job) {
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
    module: 'calendar',
    alarmDueDate: alarm.alarmDueDate.format(),
    attendee: alarm.attendee,
    eventUid: vevent.getFirstPropertyValue('uid'),
    action: alarm.action,
    ics: vcalendar.toString(),
    email: alarm.email
  };
  logger.info('Register new event alarm email for', alarm.email, 'at', alarm.alarmDueDate.clone().local().format());
  if (new ICAL.Event(vevent).isRecurring()) {
    _registerNewReccuringAlarm(context, true);
  } else {
    _registerNewAlarm(context, true);
  }
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

function _reviveAlarm(msg) {
  var context = msg.context;
  if (context && context.module === 'calendar') {
    _registerNewAlarm(context, false);
  }
}

function init() {
  pubsub.local.topic('calendar:event:updated').subscribe(_handleAlarm);
  pubsub.local.topic('cron:job:revival').subscribe(_reviveAlarm);
}

module.exports = function(dependencies) {
  helpers = dependencies('helpers');
  emailModule = dependencies('email');
  pubsub = dependencies('pubsub');
  cron = dependencies('cron');
  logger = dependencies('logger');
  userModule = dependencies('user');
  i18nLib = require('../i18n')(dependencies);

  return {
    init: init
  };
};
