'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var q = require('q');
var ICAL = require('ical.js');
var moment = require('moment');

describe('jcalHelper', function() {
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
    cron = { submit: sinon.spy() };
    this.moduleHelpers.addDep('content-sender', contentSender);
    this.moduleHelpers.addDep('helpers', helpers);
    this.moduleHelpers.addDep('pubsub', this.helpers.mock.pubsub('', localstub, {}));
    this.moduleHelpers.addDep('cron', cron);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/alarm')(this.moduleHelpers.dependencies);
    };
  });

  describe('on calendar:event:updated event', function() {
    it('should register a new alarm', function() {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');

      this.requireModule().init();
      var handleAlarm = localstub.topics['calendar:event:updated'].handler;
      handleAlarm({
        type: 'created',
        event: ICAL.Component.fromString(ics).toJSON()
      });

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
        sinon.match.func,
        sinon.match.func);
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
});
