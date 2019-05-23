(function() {
  'use strict';

  angular.module('esn.form.helper')

    .controller('esnFilterInputController', function(esnI18nService) {
      var self = this;

      self.clearFilter = clearFilter;
      self.translatedPlaceholder = '';

      self.$onInit = function() {
        self.translatedPlaceholder = esnI18nService.translate(self.placeholder || 'Filter').toString();
      };

      function clearFilter($event) {
        $event.preventDefault();
        $event.stopPropagation();
        self.onChange({ $filter: self.filter = '' });
      }
    });

})();
