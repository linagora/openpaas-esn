'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Unified Inbox Angular module services', function() {

  beforeEach(function() {
    this.JMAP = {};
    window.JMAP = this.JMAP;
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

  describe('JmapAPI service', function() {

    beforeEach(angular.mock.inject(function(JmapAPI, JmapAuth, session, $rootScope) {
      this.JmapAPI = JmapAPI;
      this.JmapAuth = JmapAuth;
      this.session = session;
      this.$rootScope = $rootScope;
    }));

    describe('getMailboxes method', function() {

      it('should login first', function() {
        var called = false;
        this.JmapAuth.login = function() {
          called = true;
        };

        this.JmapAPI.getMailboxes();

        expect(called).to.be.true;
      });

      it('should return a promise with mailboxes', function(done) {
        this.JmapAuth.login = function() {};
        this.JmapAPI.getMailboxes().then(function(result) {
          expect(result).to.deep.equal([{
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
          done();
        });
        this.$rootScope.$apply();
      });

    });
  });
});
