(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcutsRegistry', esnShortcutsRegistry);

  function esnShortcutsRegistry(_, ESN_SHORTCUTS_DEFAULT_CATEGORY) {
    var categories = [ESN_SHORTCUTS_DEFAULT_CATEGORY];
    var shortcuts = [];

    return {
      register: register,
      getById: getById,
      getShortcutsByCategoryId: getShortcutsByCategoryId,
      addCategory: addCategory,
      getAllCategories: getAllCategories,
      getTopCategories: getTopCategories,
      getSubCategoriesByCategoryId: getSubCategoriesByCategoryId
    };

    function register(shortcut) {
      if (!shortcut.id) {
        throw new Error('shortcut.id is required');
      }

      if (!shortcut.combo) {
        throw new Error('shortcut.combo is required');
      }

      if (!shortcut.description) {
        throw new Error('shortcut.description is required');
      }

      shortcut = _.assign({ category: ESN_SHORTCUTS_DEFAULT_CATEGORY.id }, shortcut);

      if (!getCategoryById(shortcut.category)) {
        throw new Error('no such category, you must add category before using it: ' + shortcut.category);
      }

      shortcuts.push(shortcut);
    }

    function getById(id) {
      return _.find(shortcuts, { id: id });
    }

    function getShortcutsByCategoryId(categoryId) {
      return _.filter(shortcuts, { category: categoryId });
    }

    function addCategory(category) {
      if (!category.id) {
        throw new Error('category.id is required');
      }

      if (!category.name) {
        throw new Error('category.name is required');
      }

      if (!category.moduleDetector) {
        throw new Error('category.moduleDetector is required');
      }

      if (category.parentId && !getCategoryById(category.parentId)) {
        throw new Error('no such parent category, you must add category before adding its sub-categories');
      }

      if (!getCategoryById(category.id)) {
        categories.push(category);
      }
    }

    function getAllCategories() {
      return categories.slice(0);
    }

    function getTopCategories() {
      var topCategories = _.filter(categories, function(category) { return !category.parentId; });

      return topCategories.slice(0);
    }

    function getSubCategoriesByCategoryId(id) {
      var subCategories = _.filter(categories, { parentId: id });

      return subCategories.slice(0);
    }

    function getCategoryById(id) {
      return _.find(categories, { id: id });
    }
  }
})(angular);
