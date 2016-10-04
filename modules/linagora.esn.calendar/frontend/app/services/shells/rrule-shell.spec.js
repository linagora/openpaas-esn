'use strict';

/* global chai: false */

var expect = chai.expect;

describe('RRuleShell Factory', function() {
  var RRuleShell, ICAL, RECUR_FREQ;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_RRuleShell_, _ICAL_, _RECUR_FREQ_) {
      RRuleShell = _RRuleShell_;
      ICAL = _ICAL_;
      RECUR_FREQ = _RECUR_FREQ_;
    });
  });

  describe('should create RRuleShell object funcation', function() {
    it('should call updateParentEvent when create RRuleShell object with interval does not exist', function() {
      var rrule = {
        freq: RECUR_FREQ[0]
      };
      var vevent = new ICAL.Component('vevent');
      var shell = new RRuleShell(rrule, vevent);

      expect(shell.vevent.getFirstPropertyValue('rrule').interval).to.deep.equal([1]);
    });

  });
});
