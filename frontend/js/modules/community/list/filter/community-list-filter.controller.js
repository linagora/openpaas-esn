(function(angular) {
  'use strict';

  angular.module('esn.community').controller('communityListFilterController', communityListFilterController);

  function communityListFilterController() {
    var self = this;

    self.clearFilter = clearFilter;

    function clearFilter($event) {
      $event.preventDefault();
      $event.stopPropagation();
      self.onChange({ $filter: self.filter = '' });
    }
  }
})(angular);
