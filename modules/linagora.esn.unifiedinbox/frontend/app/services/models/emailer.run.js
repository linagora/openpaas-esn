(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(jmap, searchService, esnAvatarService) {
      jmap.EMailer.prototype.resolve = function() {
        var self = this;

        return searchService.searchByEmail(self.email)
          .catch(angular.noop)
          .then(function(result) {
            self.name = result && result.displayName || self.name;
            self.avatarUrl = result && result.photo || esnAvatarService.generateUrl(self.email, self.name);
          });
      };
    });

})();
