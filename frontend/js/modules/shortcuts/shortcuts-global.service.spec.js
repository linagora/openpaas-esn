'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnShortcutsGlobal service', function() {
  var esnShortcutsGlobal, esnShortcuts;
  var ESN_SHORTCUTS_DEFAULT_CATEGORY;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(inject(function(
    _esnShortcutsGlobal_,
    _esnShortcuts_,
    _ESN_SHORTCUTS_DEFAULT_CATEGORY_
  ) {
    esnShortcutsGlobal = _esnShortcutsGlobal_;
    esnShortcuts = _esnShortcuts_;
    ESN_SHORTCUTS_DEFAULT_CATEGORY = _ESN_SHORTCUTS_DEFAULT_CATEGORY_;
  }));

  describe('The load fn', function() {
    it('should register global shortcuts', function() {
      esnShortcuts.register = sinon.spy();
      esnShortcutsGlobal.load();

      expect(esnShortcuts.register).to.have.been.calledWith(ESN_SHORTCUTS_DEFAULT_CATEGORY, sinon.match.object);
    });
  });
});
