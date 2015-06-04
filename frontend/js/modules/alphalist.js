'use strict';

angular.module('esn.alphalist', ['duScroll', 'esn.array-helper'])

  .constant('ALPHA_ITEMS', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')

  .factory('alphaCategoryService', ['arrayHelper', 'ALPHA_ITEMS', function(arrayHelper, ALPHA_ITEMS) {

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
        var letter = items[i][this.sortBy].toUpperCase().charAt(0);

        if (this.categories[letter]) {
          this.categories[letter].push(items[i]);
        } else {
          if (this.keepAll) {
            this.categories[this.keepAllKey].push(items[i]);
          }
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

    Categorize.prototype.get = function get() {
      return this.categories;
    };

    return Categorize;
  }])

  .directive('alphaMenu', ['$document', function($document) {
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
          var e = angular.element(document.getElementById(prefix + id));
          if (e) {
            $document.scrollToElementAnimated(e);
          }
        };
      }
    };
  }]);
