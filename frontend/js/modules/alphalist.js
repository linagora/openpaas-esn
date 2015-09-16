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
        } else {
          if (this.keepAll) {
            this.categories[this.keepAllKey].push(items[i]);
          }
        }
      }
    };

    Categorize.prototype._removeItemWithId = function _removeItemWithId(id) {
      var self = this;

      Object.keys(this.categories).forEach(function(name) {
        self.categories[name] = self.categories[name].filter(function(item) {
          return item.id !== id;
        });
      });
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
        }
      } else if (this.keepAll) {
        index = this.categories[this.keepAllKey].indexOf(item);
        if (index !== -1) {
          this.categories[this.keepAllKey].splice(index, 1);
        }
      }
    };

    Categorize.prototype._sort = function _sort() {
      var self = this;
      Object.keys(this.categories).forEach(function(name) {
        self.categories[name] = arrayHelper.sortHashArrayBy(self.categories[name], self.sortBy);
      });
    };

    Categorize.prototype.addItems = function addItems(items) {
      this._addItemsToCategories(items);
      this._sort();
    };

    Categorize.prototype.replaceItem = function replaceItem(item) {
      this._removeItemWithId(item.id);
      this._addItemsToCategories([item]);
      this._sort();
    };

    Categorize.prototype.get = function get() {
      return this.categories;
    };

    Categorize.prototype.removeItem = function removeItem(item) {
      this._removeItemFromCategories(item);
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
          var e = angular.element($('[data-' + prefix + '="' + id + '"]'));
          if (e) {
            $document.scrollToElementAnimated(e);
          }
        };
      }
    };
  });
