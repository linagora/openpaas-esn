'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMenu', function(session, JmapAPI) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/sidebar/sidebar-menu.html',
      link: function(scope, element, attrs) {
        scope.email = session.user.emails[0];
        JmapAPI.getMailboxes().then(function(mailboxes) {
          scope.mailboxes = mailboxes;
        });
      }
    };
  });
