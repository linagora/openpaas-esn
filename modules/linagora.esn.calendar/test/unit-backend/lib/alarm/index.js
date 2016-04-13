'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var q = require('q');
var ICAL = require('ical.js');
var moment = require('moment');

describe('alarm module', function() {
  var contentSender, helpers, localstub, cron;

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    contentSender = { send: sinon.stub().returns(q.when({})) };
    helpers = {
      config: {
        getBaseUrl: function(callback) {
          callback(null, 'http://localhost:8080/');
        }
      }
    };
    localstub = {};
    cron = { submit: sinon.spy(), abortAll: sinon.spy() };
    this.moduleHelpers.addDep('content-sender', contentSender);
    this.moduleHelpers.addDep('helpers', helpers);
    this.moduleHelpers.addDep('pubsub', this.helpers.mock.pubsub('', localstub, {}));
    this.moduleHelpers.addDep('cron', cron);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/alarm')(this.moduleHelpers.dependencies);
    };
  });

  function checkAlarmSubmitted() {
    expect(cron.submit).to.have.been.calledWith(
      sinon.match.string,
      sinon.match(function(date) {
        var isSame = moment(date).isSame(moment('20150611'));
        return isSame;
      }),
      sinon.match(function(job) {
        job();
        expect(contentSender.send).to.have.been.calledWith(
          { id: 'noreply@open-paas.org', objectType: 'email' },
          { id: 'slemaistre@gmail.com', objectType: 'email' },
          sinon.match.has('alarm'),
          {
            message: { subject: 'Pending event! Event: Victor Sanders' },
            template: 'event.alarm'
          },
          'email'
        );
        return true;
      }),
      sinon.match(function(context) {
        expect(context).to.shallowDeepEqual({
          action: 'EMAIL',
          attendee: 'mailto:slemaistre@gmail.com',
          eventUid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c'
        });
        return true;
      }),
      sinon.match.func,
      sinon.match.func);
  }

  describe('on calendar:event:updated event', function() {

    describe('on event deletion', function() {
      it('should abort all alarm with the right context', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'deleted',
          event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.abortAll).to.have.been.calledWith({
          eventUid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c'
        }, sinon.match.func);
      });
    });

    describe('on event creation', function() {
      it('should register a new alarm', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'created',
          event: ICAL.Component.fromString(ics).toJSON()
        });

        checkAlarmSubmitted();
      });

      it('should do nothing if action is not EMAIL', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withNotEMAILValarm.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'created',
          event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.submit).to.not.have.been.called;
      });

      it('should do nothing if vevent has no valarm', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/allday.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'created',
          event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.submit).to.not.have.been.called;
      });
    });

    describe('on event update', function() {
      it('should only register an alarm if there is no alarm for the previous version of event', function() {
        var withAlarmICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');
        var withoutAlarmICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/allday.ics').toString('utf8');
        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'updated',
          event: ICAL.Component.fromString(withAlarmICS).toJSON(),
          old_event: ICAL.Component.fromString(withoutAlarmICS).toJSON()
        });

        expect(cron.abortAll).to.not.have.been.called;
        checkAlarmSubmitted();
      });

      it('should fail if the deletion of previous alarms failed', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

        cron.abortAll = sinon.spy(function(context, callback) {
          expect(context).to.deep.equal({
            eventUid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
            attendee: 'mailto:slemaistre@gmail.com'
          });
          callback(new Error('deletion error'));
        });

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'updated',
          event: ICAL.Component.fromString(ics).toJSON(),
          old_event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.abortAll).to.have.been.called;
        expect(cron.submit).to.not.have.been.called;
      });

      it('should delete alarm for the event if any and register a new one', function() {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

        cron.abortAll = sinon.spy(function(context, callback) {
          expect(context).to.deep.equal({
            eventUid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
            attendee: 'mailto:slemaistre@gmail.com'
          });
          callback();
        });

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'updated',
          event: ICAL.Component.fromString(ics).toJSON(),
          old_event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.abortAll).to.have.been.called;
        checkAlarmSubmitted();
      });
    });

  });
});
