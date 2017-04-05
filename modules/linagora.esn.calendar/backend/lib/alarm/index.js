'use strict';

const DATE_FORMAT = 'MM-DD-YYYY';
const q = require('q');
const ICAL = require('ical.js');
const _ = require('lodash');
const moment = require('moment-timezone');
const jcalHelper = require('../helpers/jcal');
const parseEventPath = require('../helpers/event').parseEventPath;

module.exports = dependencies => {
  const helpers = dependencies('helpers');
  const emailModule = dependencies('email');
  const pubsub = dependencies('pubsub');
  const cron = dependencies('cron');
  const logger = dependencies('logger');
  const userModule = dependencies('user');
  const i18nLib = require('../i18n')(dependencies);

  return {
    init
  };

  function init() {
    pubsub.local.topic('calendar:event:updated').subscribe(_handleAlarm);
    pubsub.local.topic('cron:job:revival').subscribe(_reviveAlarm);
  }

  function _sendAlarmEmail(ics, email, eventPath) {
    return q.nfbind(userModule.findByEmail)(email)
      .then(user => q.all([
          q.nfcall(helpers.config.getBaseUrl, null),
          i18nLib.getI18nForMailer(user)
        ])
      )
      .spread((baseUrl, i18nConf) => {
        const event = jcalHelper.jcal2content(ics, baseUrl);
        const alarm = event.alarm;
        const message = {
          to: email,
          subject: event.alarm.summary
        };
        const templateName = 'event.alarm';
        const dateEvent = (event.start.timezone ?
            moment(event.start.date, DATE_FORMAT).tz(event.start.timezone) :
            moment(event.start.date, DATE_FORMAT)).format(DATE_FORMAT);

        const seeInCalendarLink = _.template('<%= baseUrl %>/#/calendar?start=<%= formatedDate %>')({
          baseUrl: baseUrl,
          formatedDate: dateEvent
        });
        const consultLink = _.template('<%= baseUrl %>/#/calendar/<%= calendarId %>/event/<%= eventUid %>/consult')({
          baseUrl: baseUrl,
          calendarId: eventPath.calendarId,
          eventUid: eventPath.eventUid
        });

        return emailModule.getMailer().sendHTML(message, templateName, {
          content: {
            baseUrl: baseUrl,
            event: event,
            alarm: alarm,
            seeInCalendarLink: seeInCalendarLink,
            consultLink: consultLink
          },
          translate: i18nConf.translate
        });
      }).catch(err => {
        logger.error('Could not send alarm email', err);
      });
  }

  function _registerNewAlarm(context, dbStorage) {
    const alarmDueDate = moment(context.alarmDueDate).toDate();

    cron.submit('Will send an event alarm once at ' + alarmDueDate.toString() + ' to ' + context.email, alarmDueDate, job, context, {dbStorage: dbStorage}, (err, job) => {
      if (err) {
        logger.error('Error while submitting the job send alarm email', err);
      } else {
        logger.info('Job send alarm email has been submitted', job);
      }
    });

    function job(callback) {
      logger.info('Try sending event alarm email to', context.email);
      _sendAlarmEmail(context.ics, context.email, context.eventPath).then(() => {
        callback();
      }, callback);
    }
  }

  function _registerNewReccuringAlarm(context, dbStorage) {
    const alarmDueDate = moment(context.alarmDueDate).toDate();

    cron.submit('Will send an event alarm once at ' + alarmDueDate.toString() + ' to ' + context.email, alarmDueDate, job, context, {dbStorage: dbStorage}, function(err, job) {
      if (err) {
        logger.error('Error while submitting the job send alarm email', err);
      } else {
        logger.info('Job send alarm email has been submitted', job);
      }
    });

    function job(callback) {
      logger.info('Try sending event alarm email to', context.email);
      _sendAlarmEmail(context.ics, context.email, context.eventPath).then(() => {
        const vcalendar = ICAL.Component.fromString(context.ics);
        const vevent = vcalendar.getFirstSubcomponent('vevent');
        const valarm = vevent.getFirstSubcomponent('valarm');
        const trigger = valarm.getFirstPropertyValue('trigger');
        const triggerDuration = moment.duration(trigger);
        let expandStart = moment().add(triggerDuration).format();

        expandStart = new Date(expandStart);
        expandStart = new Date(expandStart.getTime() + 60000);
        expandStart = new ICAL.Time.fromDateTimeString(expandStart.toISOString());

        const expand = new ICAL.RecurExpansion({
          component: vevent,
          dtstart: expandStart
        });
        const nextInstance = expand.next();

        if (nextInstance) {
          context.alarmDueDate = moment(nextInstance.clone()).add(triggerDuration).format();
          _registerNewReccuringAlarm(context, dbStorage);
        }

        callback();
      }, callback);
    }
  }

  function _onCreate(msg) {
    const vcalendar = new ICAL.Component(msg.event);
    const vevent = vcalendar.getFirstSubcomponent('vevent');
    const valarm = vevent.getFirstSubcomponent('valarm');

    if (!valarm) {
      logger.debug('No alarm: doing nothing for', msg);

      return;
    }

    const action = valarm.getFirstPropertyValue('action');

    if (action !== 'EMAIL') {
      logger.warn('VALARM not supported: doing nothing for', msg, 'and action', action);

      return;
    }

    const alarm = jcalHelper.getVAlarmAsObject(valarm, vevent.getFirstPropertyValue('dtstart'));
    const context = {
      module: 'calendar',
      alarmDueDate: alarm.alarmDueDate.format(),
      attendee: alarm.attendee,
      eventUid: vevent.getFirstPropertyValue('uid'),
      action: alarm.action,
      ics: vcalendar.toString(),
      email: alarm.email,
      eventPath: parseEventPath(msg.eventPath)
    };

    logger.info('Register new event alarm email for', alarm.email, 'at', alarm.alarmDueDate.clone().local().format());
    if (new ICAL.Event(vevent).isRecurring()) {
      _registerNewReccuringAlarm(context, true);
    } else {
      _registerNewAlarm(context, true);
    }
  }

  function _onDelete(msg) {
    const vcalendar = new ICAL.Component(msg.event);
    const vevent = vcalendar.getFirstSubcomponent('vevent');
    const eventUid = vevent.getFirstPropertyValue('uid');

    cron.abortAll({
      eventUid: eventUid
    }, err => {
      if (err) {
        logger.error('Error while deleting all the job for event ' + eventUid, err);
      } else {
        logger.info('All jobs about event ' + eventUid + ' have been deleted.');
      }
    });
  }

  function _onUpdate(msg) {
    const vcalendar = new ICAL.Component(msg.old_event);
    const vevent = vcalendar.getFirstSubcomponent('vevent');
    const eventUid = vevent.getFirstPropertyValue('uid');
    const valarm = vevent.getFirstSubcomponent('valarm');

    const abortFunction = valarm ? function(callback) {
      const alarm = jcalHelper.getVAlarmAsObject(valarm, vevent.getFirstPropertyValue('dtstart'));

      cron.abortAll({
        eventUid: eventUid,
        attendee: alarm.attendee
      }, callback);
    } : function(callback) {
      return callback();
    };

    abortFunction(err => {
      if (err) {
        return logger.error('Error while deleting all the job for event ' + eventUid, err);
      }

      _onCreate(msg);
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
    const context = msg.context;

    if (context && context.module === 'calendar') {
      _registerNewAlarm(context, false);
    }
  }
};
