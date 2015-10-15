'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Account Angular Services', function() {

  describe('The displayAccountMessage service', function() {
    var accountMessageRegistry, displayAccountMessageLevel, alertMock;

    beforeEach(function() {
      accountMessageRegistry = {};
      module('ngRoute');
      module('esn.core');
      angular.mock.module(function($provide) {
        $provide.value('accountMessageRegistry', accountMessageRegistry);
        $provide.value('displayAccountMessageLevel', displayAccountMessageLevel);
        $provide.value('$alert', function(options) {
          return alertMock(options);
        });
      });
      module('linagora.esn.account');
    });

    beforeEach(angular.mock.inject(function($rootScope, displayAccountMessage, accountMessageRegistry, $alert, displayAccountMessageLevel) {
      this.$rootScope = $rootScope;
      this.displayAccountMessage = displayAccountMessage;
      this.accountMessageRegistry = accountMessageRegistry;
      this.displayAccountMessageLevel = displayAccountMessageLevel;
      this.$alert = $alert;
    }));

    it('should call the $alert service with accountMessageRegistry content', function(done) {
      var provider = 'twitter';
      var type = 'denied';
      var message = 'The message to display';
      alertMock = function(options) {
        expect(options.content).to.equal(message);
        done();
      };

      this.displayAccountMessageLevel = function() {
        return 'error';
      };

      this.accountMessageRegistry.get = function(_provider, _type) {
        expect(_provider).to.equal(provider);
        expect(_type).to.equal(type);
        return message;
      };

      this.displayAccountMessage(provider, type);
    });

  });

  describe('The displayAccountMessageLevel service', function() {
    var accountMessageRegistry;

    beforeEach(function() {
      accountMessageRegistry = {};
      module('ngRoute');
      module('esn.core');
      module('linagora.esn.account');
    });

    beforeEach(angular.mock.inject(function($rootScope, displayAccountMessageLevel, OAUTH_MESSAGE_LEVELS) {
      this.$rootScope = $rootScope;
      this.displayAccountMessageLevel = displayAccountMessageLevel;
      this.OAUTH_MESSAGE_LEVELS = OAUTH_MESSAGE_LEVELS;
    }));

    it('should send back the right level for denied status', function() {
      expect(this.displayAccountMessageLevel('denied')).to.equal(this.OAUTH_MESSAGE_LEVELS.denied);
    });

    it('should send back the right level for error status', function() {
      expect(this.displayAccountMessageLevel('error')).to.equal(this.OAUTH_MESSAGE_LEVELS.error);
    });

    it('should send back the right level for updated status', function() {
      expect(this.displayAccountMessageLevel('updated')).to.equal(this.OAUTH_MESSAGE_LEVELS.updated);
    });

    it('should send back the right level for created status', function() {
      expect(this.displayAccountMessageLevel('created')).to.equal(this.OAUTH_MESSAGE_LEVELS.created);
    });

    it('should send back the right level for unknown status', function() {
      expect(this.displayAccountMessageLevel('not a good status')).to.equal(this.OAUTH_MESSAGE_LEVELS.default);
    });

    it('should send back the right level for undefined status', function() {
      expect(this.displayAccountMessageLevel()).to.equal(this.OAUTH_MESSAGE_LEVELS.default);
    });
  });

  describe('The accountMessageRegistry service', function() {

    beforeEach(function() {
      module('ngRoute');
      module('esn.core');
      module('linagora.esn.account');
    });

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
      var result = this.accountMessageRegistry.get('facebook', type);
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

    beforeEach(function() {
      module('ngRoute');
      module('esn.core');
      module('linagora.esn.account');
    });

    beforeEach(angular.mock.inject(function(accountService, $httpBackend, $rootScope) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
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
});
