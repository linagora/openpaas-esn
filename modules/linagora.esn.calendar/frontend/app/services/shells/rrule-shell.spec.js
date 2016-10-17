'use strict';

/* global chai: false */

var expect = chai.expect;

describe('CalRRuleShell Factory', function() {
  var CalRRuleShell, ICAL, RECUR_FREQ;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_CalRRuleShell_, _ICAL_, _RECUR_FREQ_) {
      CalRRuleShell = _CalRRuleShell_;
      ICAL = _ICAL_;
      RECUR_FREQ = _RECUR_FREQ_;
    });
  });

  describe('should create CalRRuleShell object funcation', function() {
    it('should call updateParentEvent when create CalRRuleShell object with interval does not exist', function() {
      var rrule = {
        freq: RECUR_FREQ[0]
      };
      var vevent = new ICAL.Component('vevent');
      var shell = new CalRRuleShell(rrule, vevent);

      expect(shell.vevent.getFirstPropertyValue('rrule').interval).to.deep.equal([1]);
    });

  });
});
