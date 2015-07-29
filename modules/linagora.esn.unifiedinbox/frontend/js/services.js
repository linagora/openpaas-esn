'use strict';

/*global JMAP */

angular.module('linagora.esn.unifiedinbox')

  .service('JmapAuth', function(session) {

    function login() {
      var userEmail = session.user.emails[0];
      var userPath = 'ba9b0e4c-3501-11e5-b419-0242ac110012';
      var jmapServer = 'http://localhost:8888';
      JMAP.auth.didAuthenticate(userEmail, '', {
        apiUrl: jmapServer + '/jmap/' + userPath,
        eventSourceUrl: jmapServer + '/events/' + userPath,
        uploadUrl: jmapServer + '/upload/' + userPath,
        downloadUrl: jmapServer + '/raw/' + userPath + '/{blobId}/{name}'
      });
    }

    return {
      login: login
    };
  })

  .factory('JmapAPI', function($q, JmapAuth) {

    function getMailboxes() {
      JmapAuth.login();
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
