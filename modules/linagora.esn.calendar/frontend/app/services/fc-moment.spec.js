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

  it('call fullCalendar.moment with the result of toJSDate of ical', function() {
    var icalTime = this.ICAL.Time.fromJSDate(new Date());

    icalTime.isDate = true;

    var stripTimeFunc = sinon.spy();

    this.window.$.fullCalendar.moment = function(dt) {
      expect(dt).to.deep.equal(icalTime.toJSDate());

      return {
        stripTime: stripTimeFunc
      };
    };
    this.fcMoment(icalTime);
    expect(stripTimeFunc).to.have.been.called;
  });

  it('has a duration method which is like moment.duration', function() {
    expect(this.fcMoment.duration).to.equal(this.moment.duration);
  });

});
