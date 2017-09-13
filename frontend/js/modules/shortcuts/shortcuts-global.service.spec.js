'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnShortcutsGlobal service', function() {
  var esnShortcutsGlobal, esnShortcuts;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(inject(function(_esnShortcutsGlobal_, _esnShortcuts_) {
    esnShortcutsGlobal = _esnShortcutsGlobal_;
    esnShortcuts = _esnShortcuts_;
  }));

  describe('The load fn', function() {
    it('should register and use shortcuts', function() {
      esnShortcuts.register = sinon.spy();
      esnShortcuts.use = sinon.spy();

      esnShortcutsGlobal.load();

      expect(esnShortcuts.register).to.have.been.callCount(3);
      expect(esnShortcuts.use).to.have.been.callCount(3);
    });
  });
});
