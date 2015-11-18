'use strict';

/* global chai: false */
var expect = chai.expect;

describe('fcMoment factory', function() {

  beforeEach(function() {
    this.window = {
      $: {
        fullCalendar: {}
      }
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
      $provide.value('jstz', self.jstz);
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

  it('call fullCalendar.moment with the provided ICAL.Time date and timezone', function(done) {
    var icalTime = this.ICAL.Time.fromJSDate(new Date());
    icalTime.zone = null; // Setting this to null tests code to avoid an exception in ICAL.js
    this.window.$.fullCalendar.moment = function() {
      expect(arguments[0]).to.deep.equal(icalTime.toJSDate());
      return {
        zone: function(tzid) {
          expect(tzid).to.exist;
          done();
        }
      };
    };
    this.fcMoment(icalTime);
  });
});
