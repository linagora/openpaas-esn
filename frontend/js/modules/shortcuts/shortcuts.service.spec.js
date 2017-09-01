'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnShortcuts service', function() {
  var esnShortcutsRegistry, esnShortcuts, hotkeys;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(inject(function(_esnShortcutsRegistry_, _esnShortcuts_, _hotkeys_) {
    esnShortcutsRegistry = _esnShortcutsRegistry_;
    esnShortcuts = _esnShortcuts_;
    hotkeys = _hotkeys_;
  }));

  describe('The use fn', function() {
    it('should disallow using shortcut without registering', function() {
      esnShortcutsRegistry.getById = function() {
        return null;
      };

      expect(function() {
        esnShortcuts.use('my_shortcut');
      }).to.throw(Error, 'no such shortcut: my_shortcut');
    });

    it('should disallow using shortcut without action', function() {
      esnShortcutsRegistry.getById = function() {
        return {};
      };

      expect(function() {
        esnShortcuts.use('my_shortcut');
      }).to.throw(Error, 'this shortcut is registered without action, you must provie action to use it: my_shortcut');
    });

    it('should allow using shortcut using predefined action', function() {
      esnShortcutsRegistry.getById = function() {
        return {
          action: angular.noop
        };
      };
      hotkeys.add = sinon.spy();

      esnShortcuts.use('my_shortcut');
      expect(hotkeys.add).to.have.been.called;
    });

    it('should allow using shortcut using custom action', function() {
      var customAction = angular.noop;

      esnShortcutsRegistry.getById = function() {
        return {};
      };
      hotkeys.add = sinon.spy();

      esnShortcuts.use('my_shortcut', customAction);
      expect(hotkeys.add).to.have.been.called;
    });
  });

  describe('The unuse fn', function() {
    it('should disallow unusing unregistered shortcut', function() {
      esnShortcutsRegistry.getById = function() {
        return null;
      };

      expect(function() {
        esnShortcuts.unuse('my_shortcut');
      }).to.throw(Error, 'no such shortcut: my_shortcut');
    });

    it('should delete the unused shortcut', function() {
      var shortcut = { combo: 'ctrl+enter' };

      esnShortcutsRegistry.getById = function() {
        return shortcut;
      };
      hotkeys.del = sinon.spy();

      esnShortcuts.unuse('my_shortcut');
      expect(hotkeys.del).to.have.been.calledWith(shortcut.combo);
    });
  });
});
