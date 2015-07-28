'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('JmapAPI', function($q) {

    function getMailboxes() {
      return $q.when([{
        name: 'Inbox',
        href: '/#/unifiedinbox',
        unreadMessages: 5
      }, {
        name: 'Draft',
        href: '/#/unifiedinbox',
        unreadMessages: 42
      }, {
        name: 'Spam',
        href: '/#/unifiedinbox',
        unreadMessages: 0
      }, {
        name: 'Trash',
        href: '/#/unifiedinbox',
        unreadMessages: 1
      }]);
    }

    return {
      getMailboxes: getMailboxes
    };

  });
