'use strict';

/*global O, JMAP */

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

  .factory('JmapMailboxes', function($q, ObservableArrayFactory, MAILBOX_ROLE_ORDERING_WEIGHT) {

      function searchMailboxes() {
      var deferred = $q.defer();

      var observableMailboxes = ObservableArrayFactory.create(
          JMAP.store.getQuery('allMailboxes', O.LiveQuery, {
              Type: JMAP.Mailbox
          }),
          function contentChangedCallback(mailboxes) {
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
          }
      );
      JMAP.store.on(JMAP.Mailbox, observableMailboxes, 'contentDidChange');

      return deferred.promise;
    }

    return {
      get: searchMailboxes
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
