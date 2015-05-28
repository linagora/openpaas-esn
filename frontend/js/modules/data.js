'use strict';

angular.module('esn.data', [])
  .factory('dataTableFactory', [function() {

    function initCategories(str) {
      var categories = {};
      for (var i = 0; i < str.length; i++) {
        var nextChar = str.charAt(i);
        categories[nextChar] = [];
      }
      return categories;
    }

    function categorize(list, categories, field) {
      categories = categories || {};

      if (!field) {
        return list;
      }

      for (var i = 0; i < list.length; i++) {
        var letter = list[i][field].toUpperCase().charAt(0);
        // TODO : Push all non alpha into # category
        if (!categories[letter]) {
          categories[letter] = [];
        }
        categories[letter].push(list[i]);
      }
      return categories;
    }

    function sortArrayBy(array, field) {
      if (!array) {
        return [];
      }

      array.sort(function(a, b) {

        if (!a[field] && !b[field]) {
          return 0;
        }

        if (a[field] && !b[field]) {
          return 1;
        }

        if (!a[field] && b[field]) {
          return -1;
        }

        var nameA = a[field].toUpperCase();
        var nameB = b[field].toUpperCase();
        if (nameA < nameB) {
          return -1;
        }

        if (nameA > nameB) {
          return 1;
        }

        return 0;
      });
      return array;
    }

    function sortCategoriesBy(hash, field) {

      Object.keys(hash).forEach(function(name) {
        console.log(name);
        hash[name] = sortArrayBy(hash[name], field);
      });
      return hash;
    }

    return {
      initCategories: initCategories,
      categorize: categorize,
      sortCategoriesBy: sortCategoriesBy,
      sortArrayBy: sortArrayBy
    };

  }]);
