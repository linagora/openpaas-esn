(function(angular) {
  'use strict';

  angular.module('esn.template')
    .provider('esnTemplate', function() {
      var self = this;

      self.templates = {
        loading: '/views/commons/loading.html',
        error: '/views/commons/loading-error.html',
        success: '/views/esn/partials/application.html'
      };

      self.setLoadingTemplate = function(template) {
        self.templates.loading = template;
      };

      self.setErrorTemplate = function(template) {
        self.templates.error = template;
      };

      self.setSuccessTemplate = function(template) {
        self.templates.success = template;
      };

      self.$get = function() {
        return self;
      };
    });
})(angular);
