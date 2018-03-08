'use strict';

angular.module('esn.alphalist', ['duScroll', 'esn.array-helper', 'esn.core', 'esn.charAPI'])

  .constant('ALPHA_ITEMS', '#ABCDEFGHIJKLMNOPQRSTUVWXYZ')

  .factory('AlphaCategoryService', function(arrayHelper, ALPHA_ITEMS, charAPI) {

    function Categorize(options) {
      this.options = options || {};
      this.keys = options.keys || ALPHA_ITEMS;
      this.sortBy = options.sortBy;
      this.keepAllKey = options.keepAllKey || '#';
      this.keepAll = options.keepAll;
      this.init();
      return this;
    }

    Categorize.prototype.init = function init() {
      this.numberOfItems = 0;
      this.categories = {};
      for (var i = 0; i < this.keys.length; i++) {
        var nextChar = this.keys.charAt(i);
        this.categories[nextChar] = [];
      }
      if (this.keepAll) {
        this.categories[this.keepAllKey] = [];
      }
    };

    Categorize.prototype._addItemsToCategories = function _addItemsToCategories(items) {

      for (var i = 0; i < items.length; i++) {
        var letter = charAPI.getAsciiUpperCase(items[i][this.sortBy].charAt(0));

        if (this.categories[letter]) {
          this.categories[letter].push(items[i]);
        } else if (this.keepAll) {
          this.categories[this.keepAllKey].push(items[i]);
        }
      }

      this.numberOfItems += items.length;
    };

    Categorize.prototype._removeItemWithId = function _removeItemWithId(id) {
      var self = this;

      var checkContactInCategories = function(name) {
        var inCategory = self.categories[name].some(function(item, index) {
          if (item.id === id) {
            self.categories[name].splice(index, 1);
            self.numberOfItems--;
            return true;
          }
          return false;
        });

        return inCategory;
      };

      return Object.keys(this.categories).some(checkContactInCategories);
    };

    Categorize.prototype._removeItemFromCategories = function _removeItemsFromCategories(item) {
      if (!item) {
        return;
      }
      var letter = charAPI.getAsciiUpperCase(item[this.sortBy].charAt(0));
      var index;

      if (this.categories[letter]) {
        index = this.categories[letter].indexOf(item);
        if (index !== -1) {
          this.categories[letter].splice(index, 1);
          this.numberOfItems--;
        }
      } else if (this.keepAll) {
        index = this.categories[this.keepAllKey].indexOf(item);
        if (index !== -1) {
          this.categories[this.keepAllKey].splice(index, 1);
          this.numberOfItems--;
        }
      }
    };

    Categorize.prototype._sort = function _sort(categoryName) {
      var self = this;
      if (categoryName && this.keys.indexOf(categoryName) !== -1) {
        self.categories[categoryName] = arrayHelper.sortHashArrayBy(self.categories[categoryName], self.sortBy);
      } else {
        Object.keys(this.categories).forEach(function(name) {
          self.categories[name] = arrayHelper.sortHashArrayBy(self.categories[name], self.sortBy);
        });
      }
    };

    Categorize.prototype.addItems = function addItems(items) {
      this._addItemsToCategories(items);
      this._sort();
    };

    Categorize.prototype.get = function get() {
      return this.categories;
    };

    Categorize.prototype.getNumberOfItems = function getNumberOfItems() {
      return this.numberOfItems;
    };

    Categorize.prototype.removeItem = function removeItem(item) {
      this._removeItemFromCategories(item);
    };

    Categorize.prototype.getItemCategories = function(item) {
      var self = this;
      var id = item.id;

      function checkItemInCategories(name) {
        return self.categories[name].some(function(item) {
          return item.id === id;
        });
      }

      return Object.keys(this.categories).filter(checkItemInCategories);
    };

    Categorize.prototype.replaceItem = function replaceItem(item) {
      var self = this;
      var letter = charAPI.getAsciiUpperCase(item[self.sortBy].charAt(0)) || self.keepAllKey;
      var oldCategory = self.getItemCategories(item)[0];
      var oldCategoryIndex = self.keys.indexOf(oldCategory);
      var categoryIndex = self.keys.indexOf(letter);

      self._removeItemWithId(item.id);

      function someCategoriesAreFilledAfter(letter) {
        for (var i = self.keys.indexOf(letter); i < self.keys.length; i++) {
          if (self.categories[self.keys.charAt(i)].length > 0) {
            return true;
          }
        }
        return false;
      }

      if (categoryIndex >= 0) {
        for (var i = 0; i < self.keys.length; i++) {
          var nextChar = self.keys.charAt(i);
          if (i <= oldCategoryIndex && nextChar === letter) {
            self._addItemsToCategories([item]);
            return self._sort(letter);
          } else if (self.keys.indexOf(letter) === i && someCategoriesAreFilledAfter(nextChar)) {
            self._addItemsToCategories([item]);
            return self._sort(letter);
          }
        }
      }
    };

    Categorize.prototype.removeItemWithId = function removeItemWithId(id) {
      this._removeItemWithId(id);
    };

    return Categorize;
  })

  .directive('alphaMenu', function($document) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/alphalist/alphamenu.html',
      scope: {
        keys: '=',
        prefix: '='
      },
      link: function($scope) {

        $scope.items = Array.prototype.slice.call($scope.keys);

        $scope.goToSection = function(id) {
          var prefix = $scope.prefix || 'scrollto_';
          var e = angular.element('[data-' + prefix + '="' + id + '"]');
          if (e) {
            $document.scrollToElementAnimated(e);
          }
        };
      }
    };
  });
