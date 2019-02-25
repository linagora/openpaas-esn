'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnShortcuts service', function() {
  var esnShortcutsRegistry, esnShortcuts, hotkeys, deviceDetector;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(inject(function(_esnShortcutsRegistry_, _esnShortcuts_, _hotkeys_, _deviceDetector_) {
    esnShortcutsRegistry = _esnShortcutsRegistry_;
    esnShortcuts = _esnShortcuts_;
    hotkeys = _hotkeys_;
    deviceDetector = _deviceDetector_;
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

    it('should be able to detect shortcut ID from given object', function() {
      esnShortcutsRegistry.getById = function() {
        return {
          action: angular.noop
        };
      };
      hotkeys.add = sinon.spy();

      esnShortcuts.use({ id: 'my_shortcut' });
      expect(hotkeys.add).to.have.been.called;
    });

    it('should unuse the shortcut when given scope is destroyed', function() {
      var shortcut = { combo: 'ctrl+enter' };
      var destroyCallback;
      var scope = {
        $on: function(eventName, callback) {
          expect(eventName).to.equal('$destroy');
          destroyCallback = callback;
        }
      };

      hotkeys.del = sinon.spy();
      esnShortcutsRegistry.getById = function() {
        return shortcut;
      };
      esnShortcuts.use('my_shortcut', angular.noop, scope);
      destroyCallback();

      expect(hotkeys.del).to.have.been.calledWith(shortcut.combo);
    });

    it('should do nothing on mobile', function() {
      deviceDetector.isMobile = function() { return true; };

      esnShortcutsRegistry.getById = sinon.spy();
      esnShortcuts.use();

      expect(esnShortcutsRegistry.getById).to.not.have.been.called;
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

    it('should be able to detect shortcut ID from given object', function() {
      var shortcut = { combo: 'ctrl+enter' };

      esnShortcutsRegistry.getById = function() {
        return shortcut;
      };
      hotkeys.del = sinon.spy();

      esnShortcuts.unuse({ id: 'my_shortcut' });
      expect(hotkeys.del).to.have.been.calledWith(shortcut.combo);
    });

    it('should do nothing on mobile', function() {
      deviceDetector.isMobile = function() { return true; };

      esnShortcutsRegistry.getById = sinon.spy();
      esnShortcuts.unuse();

      expect(esnShortcutsRegistry.getById).to.not.have.been.called;
    });
  });

  describe('The register fn', function() {
    it('should register both category and shortcuts if pass shortcuts as second parameter', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true };
      var shortcuts = {
        shortcut1: {
          combo: 'x',
          description: 'this is shortcut1'
        },
        shortcut2: {
          combo: 'y',
          description: 'this is shortcut2'
        }
      };

      esnShortcutsRegistry.addCategory = sinon.spy();
      esnShortcutsRegistry.register = sinon.spy();
      esnShortcutsRegistry.getById = sinon.stub();
      esnShortcutsRegistry.getById.onFirstCall().returns(shortcuts.shortcut1);
      esnShortcutsRegistry.getById.onSecondCall().returns(shortcuts.shortcut2);

      esnShortcuts.register(category, shortcuts);

      expect(esnShortcutsRegistry.addCategory).to.have.been.calledWith({ id: category.id, name: category.name, moduleDetector: true, parentId: undefined });
      expect(esnShortcutsRegistry.register).to.have.been.calledTwice;
    });

    it('should register both category and shortcuts if category object contains shortcuts', function() {
      var category = {
        id: 'my_category',
        name: 'My Category',
        moduleDetector: true,
        shortcuts: {
          shortcut1: {
            combo: 'x',
            description: 'this is shortcut1'
          },
          shortcut2: {
            combo: 'y',
            description: 'this is shortcut2'
          }
        }
      };

      esnShortcutsRegistry.addCategory = sinon.spy();
      esnShortcutsRegistry.register = sinon.spy();
      esnShortcutsRegistry.getById = sinon.stub();
      esnShortcutsRegistry.getById.onFirstCall().returns(category.shortcuts.shortcut1);
      esnShortcutsRegistry.getById.onSecondCall().returns(category.shortcuts.shortcut2);

      esnShortcuts.register(category);

      expect(esnShortcutsRegistry.addCategory).to.have.been.calledWith({ id: category.id, name: category.name, moduleDetector: true, parentId: undefined });
      expect(esnShortcutsRegistry.register).to.have.been.calledTwice;
    });

    it('should assign category and id to each shortcut', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true };
      var shortcuts = {
        shortcut1: {
          combo: 'x',
          description: 'this is shortcut1'
        },
        SHORTCUT2: {
          combo: 'y',
          description: 'this is shortcut2'
        }
      };

      esnShortcuts.register(category, shortcuts);

      expect(shortcuts.shortcut1.id).to.equal('my_category.shortcut1');
      expect(shortcuts.SHORTCUT2.id).to.equal('my_category.shortcut2');
      expect(shortcuts.shortcut1.category).to.equal(category.id);
      expect(shortcuts.SHORTCUT2.category).to.equal(category.id);
    });

    it('should register shortcuts', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true };
      var shortcuts = {
        shortcut1: {
          combo: 'x',
          description: 'this is shortcut1',
          action: angular.noop
        },
        shortcut2: {
          combo: 'y',
          description: 'this is shortcut2'
        }
      };

      hotkeys.add = sinon.spy();

      esnShortcuts.register(category, shortcuts);

      expect(hotkeys.add).to.have.been.calledTwice;
    });

    it('should do nothing on mobile', function() {
      deviceDetector.isMobile = function() { return true; };

      esnShortcutsRegistry.addCategory = sinon.spy();
      esnShortcuts.register();

      expect(esnShortcutsRegistry.addCategory).to.not.have.been.called;
    });
  });
});
