(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchResultItemController', ESNSearchResultItemController);

  function ESNSearchResultItemController($scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      // search results are getting item and query from scope
      $scope.item = self.item;
      $scope.query = self.query;
    }
  }
})(angular);
