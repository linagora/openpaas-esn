(function() {
  'use strict';

  angular.module('esn.form.helper')

    .controller('esnFilterInputController', function(esnI18nService) {
      var self = this;

      self.clearFilter = clearFilter;
      self.translatedPlaceholder = '';
      self.inputVariant = self.variant || 'standard';

      self.$onInit = function() {
        if (self.variant !== 'on-background' && self.variant !== 'standard') {
          self.inputVariant = 'standard';
        }

        self.translatedPlaceholder = esnI18nService.translate(self.placeholder || 'Filter').toString();
      };

      function clearFilter($event) {
        $event.preventDefault();
        $event.stopPropagation();
        self.onChange({ $filter: self.filter = '' });
      }
    });

})();
