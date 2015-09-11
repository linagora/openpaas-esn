'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMenu', function(session, JmapAPI) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/sidebar/sidebar-menu.html',
      link: function(scope, element, attrs) {

        function listMailboxes() {
          if (!scope.mailboxes) {
            JmapAPI.getMailboxes().then(function(mailboxes) {
              scope.mailboxes = mailboxes;
            });
          }
        }

        scope.email = session.user.preferredEmail;
        scope.toggleOpen = listMailboxes;

      }
    };
  })

  .directive('mailboxDisplay', function(MAILBOX_ROLE_ICONS_MAPPING) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        mailbox: '='
      },
      templateUrl: '/unifiedinbox/views/sidebar/mailbox-display.html',
      link: function(scope, element, attrs) {
        scope.mailboxIcons = MAILBOX_ROLE_ICONS_MAPPING[scope.mailbox.role || 'default'];
      }
    };
  });
