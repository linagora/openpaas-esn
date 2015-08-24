'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  beforeEach(function() {
    this.JMAP = {
      store: {
        getQuery: function() {
          return {
            addObserverForRange: function() {},
            reset: function() {},
            refresh: function() {}
          };
        }
      },
      Mailbox: {},
      MessageList: {
        getId: function(options) {
          return options;
        }
      }
    };
    window.JMAP = this.JMAP;
    this.O = {
      RunLoop: {
        flushAllQueues: function() {}
      }
    };
    window.O = this.O;

    angular.mock.module('esn.overture');
    angular.mock.module('esn.jmap-js');
    angular.mock.module('esn.session');
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.unifiedinbox');
  });

  describe('JmapAuth service', function() {

    beforeEach(angular.mock.inject(function(JmapAuth, session) {
      this.JmapAuth = JmapAuth;
      this.session = session;
    }));

    describe('login method', function() {

      it('should delegate to JMAP', function() {
        this.session.user = {emails: ['user@domain']};
        var called = false;
        this.JMAP.auth = {
          didAuthenticate: function(user, token, args) {
            called = true;
          }
        };

        this.JmapAuth.login();

        expect(called).to.be.true;
      });

    });
  });

  describe('JmapMailboxes service', function() {

    var mailboxesCallback, observableArray;
    var buildJmapMailbox = function(mailbox) {
      return {
        get: function(attr) {
          return mailbox[attr];
        }
      };
    };

    beforeEach(angular.mock.inject(function(JmapMailboxes, overture, $rootScope) {
      this.JmapMailboxes = JmapMailboxes;
      this.overture = overture;
      this.$rootScope = $rootScope;

      observableArray = {
        contentDidChange: function() {}
      };

      this.overture.createObservableArray = function(query, callback) {
        mailboxesCallback = callback;
        return observableArray;
      };
    }));

    describe('getMailboxes method', function() {

      it('should return a promise with mailboxes', function(done) {
        var jmapMailboxes = [
          buildJmapMailbox({
            id: 1,
            name: 'Inbox',
            role: 'inbox',
            unreadMessages: 8
          })
        ];

        this.JMAP.store.on = function() {
          mailboxesCallback(jmapMailboxes);
        };

        this.JmapMailboxes.get().then(function(result) {
          expect(result).to.deep.equal([{
            name: 'Inbox',
            role: 'inbox',
            href: '/#/unifiedinbox/1',
            unreadMessages: 8,
            orderingWeight: 5
          }]);
          done();
        });
        this.$rootScope.$apply();
      });

      it('should not resolve promise when mailboxes data is not yet available', function() {
        var jmapMailboxes = [];
        this.JMAP.store.on = function() {
          mailboxesCallback(jmapMailboxes);
        };

        var expectedResult;
        this.JmapMailboxes.get().then(function(result) {
          expectedResult = result;
        });

        this.$rootScope.$apply();

        expect(expectedResult).to.be.undefined;
      });

      it('should return mailboxes with the expected ordering weight attribute', function(done) {
        var jmapMailboxes = [
          buildJmapMailbox({
            id: 1,
            name: 'Inbox',
            role: 'inbox',
            unreadMessages: 8
          }),
          buildJmapMailbox({
            id: 2,
            name: 'Sent',
            role: 'sent',
            unreadMessages: 1
          }),
          buildJmapMailbox({
            id: 3,
            name: 'nothing',
            role: null,
            unreadMessages: 10
          })
        ];

        this.JMAP.store.on = function() {
          mailboxesCallback(jmapMailboxes);
        };

        this.JmapMailboxes.get().then(function(result) {
          expect(result).to.deep.equal([{
            name: 'Inbox',
            role: 'inbox',
            href: '/#/unifiedinbox/1',
            unreadMessages: 8,
            orderingWeight: 5
          },{
            name: 'Sent',
            role: 'sent',
            href: '/#/unifiedinbox/2',
            unreadMessages: 1,
            orderingWeight: 25
          },{
            name: 'nothing',
            role: null,
            href: '/#/unifiedinbox/3',
            unreadMessages: 10,
            orderingWeight: 45
          }]);
          done();
        });
        this.$rootScope.$apply();
      });

    });
  });

  describe('JmapEmails service', function() {

    var timeout;
    var nowDate = new Date('2015-08-20T04:00:00Z');
    var buildEmail = function(email) {
      return {
        get: function(attr) {
          return email[attr];
        }
      };
    };

    beforeEach(angular.mock.inject(function(JmapEmails, $rootScope, $timeout, jmap, overture) {
      this.JmapEmails = JmapEmails;
      this.$rootScope = $rootScope;
      this.jmap = jmap;
      timeout = $timeout;
      overture.O = this.O;

      Date.now = function() {
        return nowDate;
      };
    }));

    describe('listEmails method', function() {

      it('should request with these options', function() {
        var receivedOptions;
        this.jmap.listEmails = function(options, callback) {
          receivedOptions = options;
        };

        this.JmapEmails.get('any mailbox id');

        expect(receivedOptions).to.deep.equal({
          filter: {inMailboxes: ['any mailbox id']},
          sort: ['date desc'],
          collapseThreads: true,
          position: 0,
          limit: 100
        });
      });

      it('should return an array of empty group', function() {
        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should clean known emails when the received email list starts at position 0', function() {
        var receivedEmail1 = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: nowDate
        };
        var receivedEmail2 = {
          from: 'from value 2',
          subject: 'subject value 2',
          preview: 'preview value 2',
          hasAttachment: true,
          isUnread: true,
          date: nowDate
        };

        var listEmailsCallback;
        this.jmap.listEmails = function(options, callback) {
          listEmailsCallback = callback;
        };

        var emailsAndPosition = function(emails) {
          return {
            forEach: function(callback) {
              emails.forEach(callback);
            },
            position: 0
          };
        };

        var groupedEmails = this.JmapEmails.get('any mailbox id');
        listEmailsCallback(emailsAndPosition([buildEmail(receivedEmail1)]));
        timeout.flush();
        listEmailsCallback(emailsAndPosition([buildEmail(receivedEmail2)]));
        timeout.flush();

        expect(groupedEmails).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: [receivedEmail2]},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should not clean known emails when the received email list does not start at position 0', function() {
        var receivedEmail1 = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: nowDate
        };
        var receivedEmail2 = {
          from: 'from value 2',
          subject: 'subject value 2',
          preview: 'preview value 2',
          hasAttachment: true,
          isUnread: true,
          date: nowDate
        };

        var listEmailsCallback;
        this.jmap.listEmails = function(options, callback) {
          listEmailsCallback = callback;
        };

        var emailsAndPosition = function(emails) {
          return {
            forEach: function(callback) {
              emails.forEach(callback);
            },
            position: 1
          };
        };

        var groupedEmails = this.JmapEmails.get('any mailbox id');
        listEmailsCallback(emailsAndPosition([buildEmail(receivedEmail1)]));
        timeout.flush();
        listEmailsCallback(emailsAndPosition([buildEmail(receivedEmail2)]));
        timeout.flush();

        expect(groupedEmails).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: [receivedEmail1, receivedEmail2]},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the today group if it has the now date', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: nowDate
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: [receivedEmail]},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the today group if it has the midnight date', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-20T00:10:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: [receivedEmail]},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the today group even if it has a futur date', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-21T00:10:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: [receivedEmail]},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the week group if it is 1 days old', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-19T20:00:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: [receivedEmail]},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the week group if it is 7 days old', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-13T04:00:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: [receivedEmail]},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the month group if it is just older than one week', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-12T22:00:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: [receivedEmail]},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the month group if its date is the first of the month', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-08-01T04:00:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: [receivedEmail]},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: []}
        ]);
      });

      it('should put a received email in the older group if its date is the last day of the previous month', function() {
        var receivedEmail = {
          from: 'from value',
          subject: 'subject value',
          preview: 'preview value',
          hasAttachment: false,
          isUnread: false,
          date: '2015-07-31T04:00:00Z'
        };

        this.jmap.listEmails = function(options, callback) {
          callback([buildEmail(receivedEmail)]);
          timeout.flush();
        };

        expect(this.JmapEmails.get('any mailbox id')).to.deep.equal([
          {name: 'Today', dateFormat: 'shortTime', emails: []},
          {name: 'This Week', dateFormat: 'short', emails: []},
          {name: 'This Month', dateFormat: 'short', emails: []},
          {name: 'Older than a month', dateFormat: 'fullDate', emails: [receivedEmail]}
        ]);
      });

    });
  });

  describe('JmapAPI service', function() {

    beforeEach(angular.mock.inject(function(JmapEmails, JmapMailboxes, JmapAPI, JmapAuth) {
      this.JmapEmails = JmapEmails;
      this.JmapMailboxes = JmapMailboxes;
      this.JmapAPI = JmapAPI;
      this.JmapAuth = JmapAuth;
    }));

    describe('getMailboxes method', function() {

      it('should login first', function() {
        var called = false;
        this.JmapMailboxes.get = function() {};
        this.JmapAuth.login = function() {
          called = true;
        };

        this.JmapAPI.getMailboxes();

        expect(called).to.be.true;
      });


      it('should delegate to JmapMailboxes', function() {
        this.JmapAuth.login = function() {};
        this.JmapMailboxes.get = function() {
          return 'yolo';
        };

        expect(this.JmapAPI.getMailboxes()).to.equal('yolo');
      });

    });

    describe('getEmails method', function() {

      it('should login first', function() {
        var called = false;
        this.JmapEmails.get = function() {};
        this.JmapAuth.login = function() {
          called = true;
        };

        this.JmapAPI.getEmails();

        expect(called).to.be.true;
      });


      it('should delegate to JmapEmails', function() {
        this.JmapAuth.login = function() {};
        this.JmapEmails.get = function() {
          return 'yolo';
        };

        expect(this.JmapAPI.getEmails()).to.equal('yolo');
      });

    });

  });
});
