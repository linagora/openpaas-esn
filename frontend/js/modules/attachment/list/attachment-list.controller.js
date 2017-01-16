(function() {
  'use strict';

  angular.module('esn.attachment-list')
    .controller('ESNAttachmentListController', ESNAttachmentListController);

  function ESNAttachmentListController($q, esnAttachmentListProviders, infiniteScrollHelper, PageAggregatorService, _, ELEMENTS_PER_PAGE) {
    var self = this;
    var aggregator;
    var results_per_page = self.elementsPerPage || ELEMENTS_PER_PAGE;
    var options = {
      objectType: self.objectType,
      id: self.id,
      acceptedTypes: [self.objectType]
    };

    self.loadMoreElements = infiniteScrollHelper(self, function() {

      if (aggregator) {
        return load();
      }

      return esnAttachmentListProviders.getAll(options)
        .then(function(providers) {
          aggregator = new PageAggregatorService('AttachmentsAggregator', providers, {
            compare: function(a, b) { return b.date - a.date; },
            results_per_page: results_per_page
          });

          return load();
        });
    });

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }
  }

})();
