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
            href: '/#/unifiedinbox',
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
            name: 'Inbox',
            role: 'inbox',
            unreadMessages: 8
          }),
          buildJmapMailbox({
            name: 'Sent',
            role: 'sent',
            unreadMessages: 1
          }),
          buildJmapMailbox({
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
            href: '/#/unifiedinbox',
            unreadMessages: 8,
            orderingWeight: 5
          },{
            name: 'Sent',
            role: 'sent',
            href: '/#/unifiedinbox',
            unreadMessages: 1,
            orderingWeight: 25
          },{
            name: 'nothing',
            role: null,
            href: '/#/unifiedinbox',
            unreadMessages: 10,
            orderingWeight: 45
          }]);
          done();
        });
        this.$rootScope.$apply();
      });

    });
  });

  describe('JmapAPI service', function() {

    beforeEach(angular.mock.inject(function(JmapMailboxes, JmapAPI, JmapAuth) {
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

  });
});
