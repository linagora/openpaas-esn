'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The JMAP plugin', function() {

  var $rootScope, inboxPlugins, mailbox;

  beforeEach(function() {
    mailbox = { name: 'mailboxName', role: {} };

    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('inboxMailboxesService', {
        assignMailbox: function() {
          return $q.when(mailbox);
        }
      });
    });
  });

  beforeEach(inject(function(_$rootScope_, _inboxPlugins_) {
    $rootScope = _$rootScope_;
    inboxPlugins = _inboxPlugins_;
  }));

  it('should add a "jmap" plugin to inboxPlugins', function() {
    expect(inboxPlugins.get('jmap')).to.be.a('object');
  });

  describe('The getEmptyContextTemplateUrl function', function() {

    it('should return the default template if mailbox is a system mailbox', function(done) {
      mailbox.role = {
        value: 'inbox'
      };

      inboxPlugins.get('jmap').getEmptyContextTemplateUrl().then(function(template) {
        expect(template).to.equal('/unifiedinbox/app/services/plugins/jmap/jmap-empty-message.html');

        done();
      });
      $rootScope.$digest();
    });

    it('should return the custom template if mailbox is a custom mailbox', function(done) {
      inboxPlugins.get('jmap').getEmptyContextTemplateUrl().then(function(template) {
        expect(template).to.equal('/unifiedinbox/app/services/plugins/jmap/jmap-empty-message-custom-folder.html');

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The contextSupportsAttachments function', function() {

    it('should return true', function(done) {
      inboxPlugins.get('jmap').contextSupportsAttachments().then(function(value) {
        expect(value).to.equal(true);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The resolveContextName function', function() {

    it('should return @username', function(done) {
      inboxPlugins.get('jmap').resolveContextName('accountId').then(function(value) {
        expect(value).to.equal('mailboxName');

        done();
      });
      $rootScope.$digest();
    });

  });

});
