'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnShortcutsRegistry service', function() {
  var esnShortcutsRegistry;
  var ESN_SHORTCUTS_DEFAULT_CATEGORY;

  beforeEach(function() {
    module('esn.shortcuts');
  });

  beforeEach(inject(function(_esnShortcutsRegistry_, _ESN_SHORTCUTS_DEFAULT_CATEGORY_) {
    esnShortcutsRegistry = _esnShortcutsRegistry_;
    ESN_SHORTCUTS_DEFAULT_CATEGORY = _ESN_SHORTCUTS_DEFAULT_CATEGORY_;
  }));

  describe('The register fn', function() {
    it('should throw error when shortcut has no ID', function() {
      var shortcut = {};

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.throw(Error, 'shortcut.id is required');
    });

    it('should throw error when shortcut has no combo', function() {
      var shortcut = { id: 'my_shortcut' };

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.throw(Error, 'shortcut.combo is required');
    });

    it('should throw error when shortcut has no description', function() {
      var shortcut = { id: 'my_shortcut', combo: 'ctrl+enter' };

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.throw(Error, 'shortcut.description is required');
    });

    it('should throw error when shortcut has custom category but unregister', function() {
      var shortcut = {
        id: 'my_shortcut',
        combo: 'ctrl+enter',
        description: 'this is my shortcut',
        category: 'linagora.esn.admin'
      };

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.throw(Error, 'no such category, you must add category before using it: linagora.esn.admin');
    });

    it('should be OK when shortcut is registered without category', function() {
      var shortcut = {
        id: 'my_shortcut',
        combo: 'ctrl+enter',
        description: 'this is my shortcut'
      };

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.not.throw();
    });

    it('should be OK when shortcut is registered with custom category and it is registered', function() {
      var shortcut = {
        id: 'my_shortcut',
        combo: 'ctrl+enter',
        description: 'this is my shortcut',
        category: 'linagora.esn.admin'
      };
      var category = { id: 'linagora.esn.admin', name: 'Admin Center', moduleDetector: true };

      esnShortcutsRegistry.addCategory(category);

      expect(function() {
        esnShortcutsRegistry.register(shortcut);
      }).to.not.throw();
    });
  });

  describe('The getById fn', function() {
    it('should return nothing when no shortcut found', function() {
      expect(esnShortcutsRegistry.getById('my_shortcut')).to.be.undefined;
    });

    it('should return the found shortcut', function() {
      var shortcut = {
        id: 'my_shortcut',
        combo: 'ctrl+enter',
        description: 'this is my shortcut'
      };

      esnShortcutsRegistry.register(shortcut);

      expect(esnShortcutsRegistry.getById(shortcut.id)).to.shallowDeepEqual(shortcut);
    });
  });

  describe('The getShortcutsByCategoryId', function() {
    it('should return all shortcuts of the given category', function() {
      var shortcut1 = {
        id: 'my_shortcut1',
        combo: 'ctrl+enter',
        description: 'this is my shortcut1'
      };
      var shortcut2 = {
        id: 'my_shortcut2',
        combo: 'ctrl+enter',
        description: 'this is my shortcut2'
      };

      esnShortcutsRegistry.register(shortcut1);
      esnShortcutsRegistry.register(shortcut2);

      expect(esnShortcutsRegistry.getShortcutsByCategoryId(ESN_SHORTCUTS_DEFAULT_CATEGORY.id))
        .to.shallowDeepEqual([shortcut1, shortcut2]);
    });
  });

  describe('The addCategory fn', function() {
    it('should throw error when category has no ID', function() {
      var category = {};

      expect(function() {
        esnShortcutsRegistry.addCategory(category);
      }).to.throw(Error, 'category.id is required');
    });

    it('should throw error when category has no name', function() {
      var category = { id: 'my_category' };

      expect(function() {
        esnShortcutsRegistry.addCategory(category);
      }).to.throw(Error, 'category.name is required');
    });

    it('should throw error when category has no moduleDetector', function() {
      var category = { id: 'my_category', name: 'My Category' };

      expect(function() {
        esnShortcutsRegistry.addCategory(category);
      }).to.throw(Error, 'category.moduleDetector is required');
    });

    it('should throw error when add child category for unregisted parent category', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true, parentId: 'parent_category' };

      expect(function() {
        esnShortcutsRegistry.addCategory(category);
      }).to.throw(Error, 'no such parent category, you must add category before adding its sub-categories');
    });

    it('should disallow adding a same category more than one time', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true };

      esnShortcutsRegistry.addCategory(category);
      esnShortcutsRegistry.addCategory(category);

      expect(esnShortcutsRegistry.getAllCategories()).to.deep.equal([
        ESN_SHORTCUTS_DEFAULT_CATEGORY,
        category
      ]);
    });
  });

  describe('The getAllCategories fn', function() {
    it('should return an array of categories', function() {
      var category = { id: 'my_category', name: 'My Category', moduleDetector: true };

      esnShortcutsRegistry.addCategory(category);

      expect(esnShortcutsRegistry.getAllCategories()).to.deep.equal([
        ESN_SHORTCUTS_DEFAULT_CATEGORY,
        category
      ]);
    });
  });

  describe('The getTopCategories fn', function() {
    it('should return an array of categories which has no parent', function() {
      var parentCategory = { id: 'parent_category', name: 'Parent Category', moduleDetector: true };
      var childCategory = { id: 'child_category', name: 'Child Category', moduleDetector: true, parentId: parentCategory.id};

      esnShortcutsRegistry.addCategory(parentCategory);
      esnShortcutsRegistry.addCategory(childCategory);

      expect(esnShortcutsRegistry.getTopCategories()).to.deep.equal([
        ESN_SHORTCUTS_DEFAULT_CATEGORY,
        parentCategory
      ]);
    });
  });

  describe('The getSubCategoriesByCategoryId fn', function() {
    it('should return all sub-categories of a given category', function() {
      var parentCategory = { id: 'parent_category', name: 'Parent Category', moduleDetector: true };
      var childCategory1 = { id: 'child_category1', name: 'Child Category 1', moduleDetector: true, parentId: parentCategory.id };
      var childCategory2 = { id: 'child_category2', name: 'Child Category 2', moduleDetector: true, parentId: parentCategory.id };

      esnShortcutsRegistry.addCategory(parentCategory);
      esnShortcutsRegistry.addCategory(childCategory1);
      esnShortcutsRegistry.addCategory(childCategory2);

      expect(esnShortcutsRegistry.getSubCategoriesByCategoryId(parentCategory.id)).to.deep.equal([childCategory1, childCategory2]);
    });
  });
});
