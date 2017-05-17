'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Account Angular Services', function() {

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.account');
  });

  describe('The displayAccountMessage service', function() {
    var displayAccountMessage;
    var accountMessageRegistryMock, notificationFactoryMock;

    beforeEach(function() {
      accountMessageRegistryMock = {
        register: function() {}
      };
      notificationFactoryMock = {};
      angular.mock.module(function($provide) {
        $provide.value('accountMessageRegistry', accountMessageRegistryMock);
        $provide.value('notificationFactory', notificationFactoryMock);
      });
    });

    beforeEach(angular.mock.inject(function(_displayAccountMessage_) {
      displayAccountMessage = _displayAccountMessage_;
    }));

    it('should call the notificationFactory service with accountMessageRegistry content', function(done) {
      var provider = 'twitter';
      var status = 'denied';
      var message = 'The message to display';

      notificationFactoryMock.weakInfo = function(title, text) {
        expect(text).to.equal(message);
        done();
      };

      accountMessageRegistryMock.get = function(_provider, _status) {
        expect(_provider).to.equal(provider);
        expect(_status).to.equal(status);

        return message;
      };

      displayAccountMessage(provider, status);
    });
  });

  describe('The accountMessageRegistry service', function() {

    beforeEach(angular.mock.inject(function(accountMessageRegistry, $rootScope, OAUTH_DEFAULT_MESSAGES, OAUTH_UNKNOWN_MESSAGE) {
      this.$rootScope = $rootScope;
      this.accountMessageRegistry = accountMessageRegistry;
      this.OAUTH_DEFAULT_MESSAGES = OAUTH_DEFAULT_MESSAGES;
      this.OAUTH_UNKNOWN_MESSAGE = OAUTH_UNKNOWN_MESSAGE;
    }));

    it('should send back the registered message', function() {
      var provider = 'twitter';
      var type = 'denied';
      var message = 'A denied message';
      var messages = {};
      messages[type] = message;

      this.accountMessageRegistry.register(provider, messages);
      var result = this.accountMessageRegistry.get(provider, type);
      expect(result).to.equal(message);
    });

    it('should send back the default message when type not found in provider', function() {
      var provider = 'twitter';
      var type = 'denied';
      var messages = {};

      this.accountMessageRegistry.register(provider, messages);
      var result = this.accountMessageRegistry.get(provider, type);
      expect(result).to.equal(this.OAUTH_DEFAULT_MESSAGES[type]);
    });

    it('should send back the unknown message when type not found in provider nor defaults', function() {
      var provider = 'twitter';
      var type = 'a bad type';
      var messages = {};

      this.accountMessageRegistry.register(provider, messages);
      var result = this.accountMessageRegistry.get(provider, type);
      expect(result).to.equal(this.OAUTH_UNKNOWN_MESSAGE);
    });

    it('should send back the default message when provider not found', function() {
      var provider = 'twitter';
      var type = 'denied';
      var messages = {};

      this.accountMessageRegistry.register(provider, messages);
      var result = this.accountMessageRegistry.get('yookee', type);
      expect(result).to.equal(this.OAUTH_DEFAULT_MESSAGES[type]);
    });

    it('should send back the unknown message when provider not found and default not found', function() {
      var provider = 'twitter';
      var type = 'a bad type';
      var messages = {};

      this.accountMessageRegistry.register(provider, messages);
      var result = this.accountMessageRegistry.get('facebook', type);
      expect(result).to.equal(this.OAUTH_UNKNOWN_MESSAGE);
    });

  });

  describe('The accountService service', function() {

    beforeEach(angular.mock.inject(function(accountService, $httpBackend, $rootScope) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.accountService = accountService;
    }));

    describe('The getAccounts function', function() {
      it('should call GET /account/api/accounts', function() {
        this.$httpBackend.expectGET('/account/api/accounts').respond([]);
        this.accountService.getAccounts();
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });

      it('should call GET /account/api/accounts?type=:type', function() {
        var options = {type: 'oauth'};
        this.$httpBackend.expectGET('/account/api/accounts?type=oauth').respond([]);
        this.accountService.getAccounts(options);
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });
  });

  describe('The socialHelper service', function() {

    beforeEach(angular.mock.inject(function(socialHelper, $rootScope) {
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.socialHelper = socialHelper;
    }));

    describe('The socialHelper function', function() {
      it('should translate OAUTH_SOCIAL_MESSAGES correctly', function() {
        var expectedResult = {
          config_error: 'The google account module is not configured in the application',
          denied: 'You denied access to your google account',
          error: 'An error occured while accessing to your google account',
          updated: 'Your google account has been updated',
          created: 'Your google account has been successfully linked'
        };
        var message = this.socialHelper.getAccountMessages('google');
        expect(message).to.deep.equal(expectedResult);
      });
    });
  });
});
