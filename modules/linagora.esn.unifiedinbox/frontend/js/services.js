'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('JmapAPI', function($q) {

    function getMailboxes() {
      return $q.when([{
        name: 'Inbox',
        role: 'inbox',
        href: '/#/unifiedinbox',
        unreadMessages: 5
      }, {
        name: 'Draft',
        role: 'drafts',
        href: '/#/unifiedinbox',
        unreadMessages: 42
      }, {
        name: 'Sent',
        role: 'sent',
        href: '/#/unifiedinbox',
        unreadMessages: 0
      }, {
        name: 'Trash',
        role: 'trash',
        href: '/#/unifiedinbox',
        unreadMessages: 1
      }]);
    }

    return {
      getMailboxes: getMailboxes
    };

  });
