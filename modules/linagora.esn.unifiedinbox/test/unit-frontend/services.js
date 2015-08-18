'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  beforeEach(function() {
    this.JMAP = {
      store: {},
      Mailbox: {}
    };
    window.JMAP = this.JMAP;
    this.O = {};
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

    beforeEach(angular.mock.inject(function(JmapMailboxes, overture, $rootScope) {
      this.JmapMailboxes = JmapMailboxes;
      this.overture = overture;
      this.$rootScope = $rootScope;
    }));

    var buildJmapMailbox = function(mailbox) {
      return {
        get: function(attr) {
          return mailbox[attr];
        }
      };
    };

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

        var mailboxesCallback;
        this.overture.createObservableArray = function(query, callback) {
          mailboxesCallback = callback;
          return {};
        };
        this.JMAP.store.getQuery = function() {};
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

        var mailboxesCallback;
        this.overture.createObservableArray = function(query, callback) {
          mailboxesCallback = callback;
          return {};
        };
        this.JMAP.store.getQuery = function() {};
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

    beforeEach(angular.mock.inject(function(JmapEmails, $rootScope) {
      this.JmapEmails = JmapEmails;
      this.$rootScope = $rootScope;
    }));

    describe('listEmails method', function() {

      it('should return a promise with emails', function(done) {
        var mailbox = 'foo';
        this.JmapEmails.get(mailbox).then(function(result) {
          expect(result).to.deep.equal([
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
          done();
        });
        this.$rootScope.$apply();
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
