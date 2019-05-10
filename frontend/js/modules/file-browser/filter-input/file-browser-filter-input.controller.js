(function(angular) {
  'use strict';

  angular.module('esn.file-browser')
    .controller('fileBrowserFilterInputController', fileBrowserFilterInputController);

  function fileBrowserFilterInputController() {
    var self = this;

    self.clearFilter = clearFilter;

    function clearFilter() {
      self.query = '';

      return false;
    }
  }
})(angular);
