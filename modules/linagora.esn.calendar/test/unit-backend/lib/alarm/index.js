'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var q = require('q');
var ICAL = require('ical.js');
var moment = require('moment');

describe('alarm module', function() {
  var emailModule, sendHTMLMock, helpers, localstub, cron, userLib;

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    sendHTMLMock = sinon.stub().returns(q.when({}));
    emailModule = {
      getMailer: function() {
        return { sendHTML: sendHTMLMock };
      }
    };
    helpers = {
      config: {
        getBaseUrl: function(user, callback) {
          callback(null, 'http://localhost:8080/');
        }
      }
    };
    localstub = {};
    cron = { submit: sinon.spy(), abortAll: sinon.spy() };
    userLib = {
      findByEmail: (email, cb) => {
        cb();
      }
    };
    this.moduleHelpers.addDep('email', emailModule);
    this.moduleHelpers.addDep('helpers', helpers);
    this.moduleHelpers.addDep('pubsub', this.helpers.mock.pubsub('', localstub, {}));
    this.moduleHelpers.addDep('cron', cron);
    this.moduleHelpers.addDep('user', userLib);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/alarm')(this.moduleHelpers.dependencies);
    };
  });

  function checkAlarmSubmitted(done) {
    expect(cron.submit).to.have.been.calledWith(
      sinon.match.string,
      sinon.match(function(date) {
        var isSame = moment(date).isSame(moment('20150611'));
        return isSame;
      }),
      sinon.match(function(job) {
        job(function() {
          expect(sendHTMLMock).to.have.been.calledWith(
            sinon.match({
              to: 'slemaistre@gmail.com',
              subject: 'Pending event! Event: Victor Sanders'
            }),
            'event.alarm',
            sinon.match.has('content', sinon.match.has('alarm'))
          );

          done && done();
        });

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
      sinon.match(function(opts) {
        expect(opts).to.deep.equal({dbStorage: true});
        return true;
      }),
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
      it('should register a new alarm without recuring', function(done) {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'created',
          eventPath: '/calendars/USER/CAL_ID/EVENT_UID.ics',
          event: ICAL.Component.fromString(ics).toJSON()
        });

        checkAlarmSubmitted(done);
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

      it('should register a new alarm with recuring', function(done) {
        var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARMandRRULE.ics').toString('utf8');

        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'created',
          eventPath: '/calendars/USER/CAL_ID/EVENT_UID.ics',
          event: ICAL.Component.fromString(ics).toJSON()
        });
        expect(cron.submit).to.have.been.called.twice;
        checkAlarmSubmitted(done);
      });
    });

    describe('on event update', function() {
      it('should only register an alarm if there is no alarm for the previous version of event without recuring', function(done) {
        var withAlarmICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');
        var withoutAlarmICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/allday.ics').toString('utf8');
        this.requireModule().init();
        var handleAlarm = localstub.topics['calendar:event:updated'].handler;
        handleAlarm({
          type: 'updated',
          eventPath: '/calendars/USER/CAL_ID/EVENT_UID.ics',
          event: ICAL.Component.fromString(withAlarmICS).toJSON(),
          old_event: ICAL.Component.fromString(withoutAlarmICS).toJSON()
        });

        expect(cron.abortAll).to.not.have.been.called;
        checkAlarmSubmitted(done);
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

      it('should delete alarm for the event if any and register a new one', function(done) {
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
          eventPath: '/calendars/USER/CAL_ID/EVENT_UID.ics',
          event: ICAL.Component.fromString(ics).toJSON(),
          old_event: ICAL.Component.fromString(ics).toJSON()
        });

        expect(cron.abortAll).to.have.been.called;
        checkAlarmSubmitted(done);
      });
    });

    it('should only register an alarm if there is no alarm for the previous version of event with recuring', function(done) {
      const withAlarmRRULEICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARMandRRULE.ics').toString('utf8');
      const withoutAlarmICS = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/allday.ics').toString('utf8');

      this.requireModule().init();

      const handleAlarm = localstub.topics['calendar:event:updated'].handler;

      handleAlarm({
        type: 'updated',
        eventPath: '/calendars/USER/CAL_ID/EVENT_UID.ics',
        event: ICAL.Component.fromString(withAlarmRRULEICS).toJSON(),
        old_event: ICAL.Component.fromString(withoutAlarmICS).toJSON()
      });

      expect(cron.abortAll).to.not.have.been.called;
      checkAlarmSubmitted(done);
    });

  });

  describe('on cron:job:revival', function() {
    it('should do nothing if the job is not a calendar job', function() {
      this.requireModule().init();
      var handleAlarm = localstub.topics['cron:job:revival'].handler;
      handleAlarm({
        context: {
          module: 'otherModule'
        }
      });
      expect(cron.submit).to.not.have.been.called;
    });

    it('should register a new alarm', function() {
      this.requireModule().init();
      var handleAlarm = localstub.topics['cron:job:revival'].handler;
      var context = {
        module: 'calendar',
        alarmDueDate: moment().add(1, 'hours').format(),
        ics: fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8')
      };
      handleAlarm({
        context: context
      });
      expect(cron.submit).to.have.been.calledWith(
        sinon.match.string,
        sinon.match(function(date) {
          var isSame = moment(date).isSame(moment(context.alarmDueDate));
          return isSame;
        }),
        sinon.match.func,
        sinon.match(function(context) {
          expect(context).to.deep.equal(context);
          return true;
        }),
        sinon.match(function(opts) {
          expect(opts).to.deep.equal({dbStorage: false});
          return true;
        }),
        sinon.match.func);
    });
  });
});
