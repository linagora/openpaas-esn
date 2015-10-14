'use strict';

angular.module('linagora.esn.unifiedinbox')

  .directive('inboxMenu', function(session, jmapClient) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/unifiedinbox/views/sidebar/sidebar-menu.html',
      link: function(scope) {
        scope.toggleOpen = function() {
          if (!scope.mailboxes) {
            jmapClient.getMailboxes().then(function(mailboxes) {
              scope.mailboxes = mailboxes;
            });
          }
        };

        scope.email = session.user.preferredEmail;
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
      link: function(scope) {
        scope.mailboxIcons = MAILBOX_ROLE_ICONS_MAPPING[scope.mailbox.role || 'default'];
      }
    };
  })

  .directive('emailer', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        emailer: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer.html'
    };
  })

  .directive('emailerGroup', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '='
      },
      templateUrl: '/unifiedinbox/views/partials/emailer-group.html'
    };
  });
