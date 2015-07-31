'use strict';

angular.module('linagora.esn.unifiedinbox')

  .service('JmapAuth', function(session, jmap) {

    var accessToken = 'ba9b0e4c-3501-11e5-b419-0242ac110012';
    var jmapServerUrl = 'http://localhost:8888';

    this.login = function() {
      var userEmail = session.user.emails[0];
      jmap.login(userEmail, accessToken, jmapServerUrl);
    };

  })

  .factory('JmapMailboxes', function($q, jmap, MAILBOX_ROLE_ORDERING_WEIGHT) {

    function listMailboxes() {
      var deferred = $q.defer();
      jmap.listMailboxes(function(mailboxes) {
        var allMailboxes = mailboxes.map(function(box) {
          return {
            name: box.get('name'),
            role: box.get('role'),
            href: '/#/unifiedinbox',
            unreadMessages: box.get('unreadMessages'),
            orderingWeight: MAILBOX_ROLE_ORDERING_WEIGHT[box.get('role') || 'default']
          };
        });
        deferred.resolve(allMailboxes);
      });
      return deferred.promise;
    }

    return {
      get: listMailboxes
    };
  })

  .factory('JmapAPI', function($q, JmapAuth, JmapMailboxes) {

    function getMailboxes() {
      JmapAuth.login();
      return JmapMailboxes.get();
    }

    return {
      getMailboxes: getMailboxes
    };

  });
