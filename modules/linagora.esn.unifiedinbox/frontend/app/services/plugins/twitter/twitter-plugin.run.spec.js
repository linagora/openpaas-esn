'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Twitter plugin', function() {

  var $rootScope, inboxPlugins;

  beforeEach(function() {
    module('linagora.esn.unifiedinbox');
  });

  beforeEach(inject(function(_$rootScope_, _inboxPlugins_, session) {
    $rootScope = _$rootScope_;
    inboxPlugins = _inboxPlugins_;

    session.getProviderAccounts = function() {
      return [{
        id: 'accountId',
        username: 'myUsername'
      }];
    };
  }));

  it('should add a "twitter" plugin to inboxPlugins', function() {
    expect(inboxPlugins.get('twitter')).to.be.a('object');
  });

  describe('The getEmptyContextTemplateUrl function', function() {

    it('should return the twitter template', function(done) {
      inboxPlugins.get('twitter').getEmptyContextTemplateUrl().then(function(template) {
        expect(template).to.equal('/unifiedinbox/app/services/plugins/twitter/twitter-empty-message.html');

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The contextSupportsAttachments function', function() {

    it('should return false', function(done) {
      inboxPlugins.get('twitter').contextSupportsAttachments().then(function(value) {
        expect(value).to.equal(false);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The resolveContextName function', function() {

    it('should return @username', function(done) {
      inboxPlugins.get('twitter').resolveContextName('accountId').then(function(value) {
        expect(value).to.equal('@myUsername');

        done();
      });
      $rootScope.$digest();
    });

  });

});
