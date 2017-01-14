'use strict';

/* global chai, __FIXTURES__: false */

var expect = chai.expect;

describe('VAlarmShell factory', function() {
  var ICAL, CalVAlarmShell;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_ICAL_, _CalVAlarmShell_) {
      ICAL = _ICAL_;
      CalVAlarmShell = _CalVAlarmShell_;
    });

    function getComponentFromFixture(string) {
      var path = 'modules/linagora.esn.calendar/frontend/app/fixtures/calendar/valarm_test/' + string;

      return new ICAL.Component(JSON.parse(__FIXTURES__[path]));
    }

    this.alarm = getComponentFromFixture('valarm.json');
    this.event = getComponentFromFixture('vevent.json');

    this.myAlarmShell = new CalVAlarmShell(this.alarm, this.event);
  });

  describe('action fn', function() {
    it('should return the action type', function() {
      expect(this.myAlarmShell.action).to.equal('EMAIL');
    });
  });

  describe('trigger fn', function() {
    it('should return the trigger', function() {
      expect(this.myAlarmShell.trigger.toICALString()).to.equal('-PT1M');
    });
  });

  describe('description fn', function() {
    it('should return the description', function() {
      expect(this.myAlarmShell.description).to.equal('This is a description');
    });
  });

  describe('summary fn', function() {
    it('should return the summary', function() {
      expect(this.myAlarmShell.summary).to.equal('Pending event! ');
    });
  });

  describe('attendee fn', function() {
    it('should return the attendee', function() {
      expect(this.myAlarmShell.attendee).to.equal('mailto:admin@open-paas.org');
    });
  });

  describe('equals fn', function() {
    it('should return false if the value is undefined', function() {
      expect(this.myAlarmShell.equals()).to.be.false;
    });

    it('should return true if the value is the same object alam shell', function() {
      expect(this.myAlarmShell.equals(this.myAlarmShell)).to.be.true;
    });

    it('should return true if the value is the same alam shell', function() {
      var myAlarmShellEqual = new CalVAlarmShell(this.alarm, this.event);

      expect(this.myAlarmShell.equals(myAlarmShellEqual)).to.be.true;
    });

    it('should return false if the trigger value is different', function() {
      var newAlarm = ICAL.Component.fromString(this.alarm.toString());

      newAlarm.updatePropertyWithValue('trigger', '-PT12H');
      var myAlarmShellDifferent = new CalVAlarmShell(newAlarm, this.event);

      expect(this.myAlarmShell.equals(myAlarmShellDifferent)).to.be.false;
    });

    it('should return false if one of the other value is different', function() {
      var newAlarm = ICAL.Component.fromString(this.alarm.toString());

      newAlarm.updatePropertyWithValue('summary', 'My new summary');
      var myAlarmShellDifferent = new CalVAlarmShell(newAlarm, this.event);

      expect(this.myAlarmShell.equals(myAlarmShellDifferent)).to.be.false;
    });
  });
});
