'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('fcMoment factory', function() {

  beforeEach(function() {
    this.window = {
      $: {
        fullCalendar: {}
      }
    };

    this.moment = {
      duration: 'it doesn not matter as long as it is here'
    };

    this.jstz = {
      determine: function() {
        return {
          name: function() {
            return 'Europe/Paris';
          }};
      }
    };

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('$window', self.window);
      $provide.value('_', function() {});
      $provide.value('jstz', self.jstz);
      $provide.constant('moment', self.moment);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(fcMoment, ICAL) {
      this.fcMoment = fcMoment;
      this.ICAL = ICAL;
    });
  });

  it('call fullCalendar.moment directly if there is no argument', function(done) {
    this.window.$.fullCalendar.moment = function() {
      expect(arguments.length).to.equal(0);
      done();
    };
    this.fcMoment();
  });

  it('call fullCalendar.moment directly if the argument is not an ICAL.Time', function(done) {
    var date = new Date();
    this.window.$.fullCalendar.moment = function() {
      expect(arguments[0]).to.deep.equal(date);
      done();
    };
    this.fcMoment(date);
  });

  it('call fullCalendar.moment with the provided ICAL.Time datetime and local zone', function() {
    var icalTime = this.ICAL.Time.fromJSDate(new Date());
    icalTime.zone = null; // Setting this to null tests code to avoid an exception in ICAL.js

    var stripTimeFunc = sinon.spy();
    var utcOffsetFunc = sinon.spy();

    this.window.$.fullCalendar.moment = function(dt) {
      expect(dt).to.deep.equal(icalTime.toJSDate());
      return {
        stripTime: stripTimeFunc,
        utcOffset: utcOffsetFunc
      };
    };
    this.fcMoment(icalTime);
    expect(stripTimeFunc).to.not.have.been.called;
    expect(utcOffsetFunc).to.not.have.been.called;
  });

  it('call fullCalendar.moment with the provided ICAL.Time datetime and remote zone', function() {
    var zoneData = [
      'BEGIN:VTIMEZONE',
      'TZID:America/New_York',
      'X-LIC-LOCATION:America/New_York',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:-0500',
      'TZOFFSETTO:-0400',
      'TZNAME:EDT',
      'DTSTART:19700308T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:-0400',
      'TZOFFSETTO:-0500',
      'TZNAME:EST',
      'DTSTART:19701101T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
      'END:STANDARD',
      'END:VTIMEZONE'
    ].join('\r\n');

    var icalTime = this.ICAL.Time.fromString('2015-11-09T14:00:00');
    icalTime.zone  = new this.ICAL.Timezone({ component: zoneData });

    var stripTimeFunc = sinon.spy();
    var utcOffsetFunc = sinon.spy(function(val) {
      expect(val).to.equal(-18000);
    });

    this.window.$.fullCalendar.moment = function(dt) {
      expect(dt).to.deep.equal(icalTime.toJSDate());
      return {
        stripTime: stripTimeFunc,
        utcOffset: utcOffsetFunc
      };
    };
    this.fcMoment(icalTime);
    expect(stripTimeFunc).to.not.have.been.called;
    expect(utcOffsetFunc).to.have.been.called;
  });

  it('call fullCalendar.moment with the provided ICAL.Time date and local zone', function() {
    var icalTime = this.ICAL.Time.fromJSDate(new Date());
    icalTime.isDate = true;
    icalTime.zone = null;

    var stripTimeFunc = sinon.spy();
    var utcOffsetFunc = sinon.spy();

    this.window.$.fullCalendar.moment = function(dt) {
      expect(dt).to.deep.equal(icalTime.toJSDate());
      return {
        stripTime: stripTimeFunc,
        utcOffset: utcOffsetFunc
      };
    };
    this.fcMoment(icalTime);
    expect(stripTimeFunc).to.have.been.called;
    expect(utcOffsetFunc).to.not.have.been.called;
  });

  it('has a duration method which is like moment.duration', function() {
    expect(this.fcMoment.duration).to.equal(this.moment.duration);
  });

  it('call fullCalendar.moment with the provided ICAL.Time datetime without setting utcOffset if it is 0', function() {
    var icalTime = this.ICAL.Time.fromJSDate(new Date());
    icalTime.zone = 'aZone';
    icalTime.utcOffset = function() {
      return 0;
    };

    var utcOffsetFunc = sinon.spy();

    this.window.$.fullCalendar.moment = function(dt) {
      expect(dt).to.deep.equal(icalTime.toJSDate());
      return {
        utcOffset: utcOffsetFunc
      };
    };
    this.fcMoment(icalTime);
    expect(utcOffsetFunc).to.not.have.been.called;
  });
});
