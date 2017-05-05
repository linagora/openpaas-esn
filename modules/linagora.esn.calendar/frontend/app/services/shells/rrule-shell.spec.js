'use strict';

/* global chai: false */

var expect = chai.expect;

describe('CalRRuleShell Factory', function() {
  var CalRRuleShell, ICAL, CAL_RECUR_FREQ;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_CalRRuleShell_, _ICAL_, _CAL_RECUR_FREQ_) {
      CalRRuleShell = _CalRRuleShell_;
      ICAL = _ICAL_;
      CAL_RECUR_FREQ = _CAL_RECUR_FREQ_;
    });
  });

  describe('should create CalRRuleShell object funcation', function() {
    it('should call updateParentEvent when create CalRRuleShell object with interval does not exist', function() {
      var rrule = {
        freq: CAL_RECUR_FREQ[0]
      };
      var vevent = new ICAL.Component('vevent');
      var shell = new CalRRuleShell(rrule, vevent);

      expect(shell.vevent.getFirstPropertyValue('rrule').interval).to.deep.equal(1);
    });
  });

  describe('set count', function() {
    var shell, vevent;

    beforeEach(function() {
      var rrule = {
        freq: CAL_RECUR_FREQ[0]
      };

      vevent = new ICAL.Component('vevent');
      shell = new CalRRuleShell(rrule, vevent);
    });

    it('should delete the count cache property', function() {
      shell.__count = 42;
      shell.count = 2;
      expect(shell.__count).to.be.undefined;
    });

    it('should fail for non number value', function() {
      expect(function() {
        shell.count = 'toto';
      }).to.throw(Error);
    });

    it('should copy number as if (without packing them in an array)', function() {
      shell.count = 42;
      expect(shell.rrule.count).to.equals(42);
    });
  });
});
