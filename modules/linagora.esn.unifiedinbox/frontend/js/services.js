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
            href: '/#/unifiedinbox/' + box.get('id'),
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

  .factory('JmapEmails', function($q, jmap) {

    function listEmails(mailbox) {
      return $q.when([
        {name: 'Today', emails: [{
          from: {name: 'display name', email: 'from@email'},
          subject: 'today' + mailbox,
          preview: 'preview',
          hasAttachment: true,
          isUnread: true,
          date: '2015-08-20T03:24:00'}
        ]},
        {name: 'This Week', emails: [{
          from: {name: 'display name', email: 'from@email'},
          subject: 'last week' + mailbox,
          preview: 'preview',
          hasAttachment: false,
          isUnread: true,
          date: '2015-08-17T03:24:00'}
        ]},
        {name: 'This Month', emails: [{
          from: {name: 'display name', email: 'from@email'},
          subject: 'this month' + mailbox,
          preview: 'preview',
          hasAttachment: true,
          isUnread: false,
          date: '2015-07-27T03:24:00'}
        ]},
        {name: 'Older than a month', emails: [{
          from: {name: 'display name', email: 'from@email'},
          subject: 'old email' + mailbox,
          preview: 'preview',
          hasAttachment: false,
          isUnread: false,
          date: '2014-01-10T03:24:00'}
        ]},
      ]);
    }

    return {
      get: listEmails
    };
  })

  .factory('JmapAPI', function($q, JmapAuth, JmapMailboxes, JmapEmails) {

    function getMailboxes() {
      JmapAuth.login();
      return JmapMailboxes.get();
    }

    function getEmails(mailbox) {
      JmapAuth.login();
      return JmapEmails.get(mailbox);
    }

    return {
      getMailboxes: getMailboxes,
      getEmails: getEmails
    };

  });
