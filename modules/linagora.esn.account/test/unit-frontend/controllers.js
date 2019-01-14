'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Account Angular Controllers', function() {

  var $rootScope, $controller, $scope, SUPPORTED_ACCOUNTS, ACCOUNT_EVENTS, ACCOUNT_MESSAGES, displayAccountMessage, dynamicDirectiveService;

  beforeEach(function() {
    angular.mock.module('esn.notification');
    angular.mock.module('linagora.esn.account');
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _SUPPORTED_ACCOUNTS_, _ACCOUNT_EVENTS_, _ACCOUNT_MESSAGES_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    SUPPORTED_ACCOUNTS = _SUPPORTED_ACCOUNTS_;
    ACCOUNT_EVENTS = _ACCOUNT_EVENTS_;
    ACCOUNT_MESSAGES = _ACCOUNT_MESSAGES_;
    $scope = $rootScope.$new();
  }));

  describe('The accountListController controller', function() {

    var $location = {};
    beforeEach(function() {
      $location.search = function() {return {};};
      dynamicDirectiveService = {
        getInjections: function() { return ['foo']; }
      };
    });

    function createController(accounts, providers) {
      $controller('accountListController', {
        $scope: $scope,
        $location: $location,
        accounts: accounts,
        providers: providers,
        dynamicDirectiveService: dynamicDirectiveService,
        displayAccountMessage: displayAccountMessage,
        SUPPORTED_ACCOUNTS: SUPPORTED_ACCOUNTS,
        ACCOUNT_EVENTS: ACCOUNT_EVENTS
      });
    }

    it('should only keep the SUPPORTED_ACCOUNTS accounts', function() {
      var accounts = [
        { type: 'oauth', data: {provider: 'twitter', id: 'keep' } },
        { type: 'email'},
        { type: 'foo', data: {provider: 'bar'} }
      ];
      var providers = ['twitter', 'bar'];

      createController(accounts, providers);
      $rootScope.$digest();

      expect($scope.accounts.length).to.equal(1);
      expect($scope.accounts[0].id).to.equal('keep');
    });

    it('should not set hasAccountProvider to true if no provider available', function() {
      var providers = [];
      var accounts = [{ type: 'oauth', data: { provider: 'foo', id: 'bar' } }];

      createController(accounts, providers);
      $rootScope.$digest();

      expect($scope.hasAccountProvider).to.be.undefined;
    });

    it('should not set hasAccountProvider to true if no provider dynamic directive injection available', function() {
      var providers = ['twitter'];
      var accounts = [{ type: 'oauth', data: { provider: 'foo', id: 'bar' } }];

      dynamicDirectiveService = {
        getInjections: sinon.stub().returns([])
      };

      createController(accounts, providers);
      $rootScope.$digest();

      expect($scope.hasAccountProvider).to.be.undefined;
      expect(dynamicDirectiveService.getInjections).to.have.been.called;
    });

    it('should only keep the accounts with provider', function() {
      var providers = ['bar'];
      var accounts = [
        { type: 'oauth', data: {noprovider: 'nop', id: 'notkeep' } },
        { type: 'email' },
        { type: 'oauth', data: { provider: 'bar', id: 'keep' } }
      ];

      createController(accounts, providers);
      $rootScope.$digest();

      expect($scope.accounts.length).to.equal(1);
      expect($scope.accounts[0].id).to.equal('keep');
    });

    it('should call displayAccountMessage if $location.search().status', function(done) {
      var provider = 'twitter';
      var status = 'error';

      $location.search = function() {
        return {
          status: status,
          provider: provider
        };
      };
      displayAccountMessage = function(_provider, _status) {
        expect(_provider).to.equal(provider);
        expect(_status).to.equal(status);
        done();
      };
      var accounts = [];
      var providers = ['twitter'];

      createController(accounts, providers);
      $rootScope.$digest();
    });

    it('should remove account on account deleted event', function() {
      var account1 = {type: 'oauth', data: {id: 1, provider: 'social'}};
      var account2 = {type: 'oauth', data: {id: 2, provider: 'social'}};
      var account3 = {type: 'oauth', data: {id: 3, provider: 'social'}};
      var accounts = [account1, account2, account3];
      var providers = ['social'];

      createController(accounts, providers);
      $rootScope.$digest();
      expect($scope.accounts.length).to.equal(3);
      $scope.$broadcast(ACCOUNT_EVENTS.DELETED, 2);
      expect($scope.accounts.length).to.equal(2);
      expect($scope.accounts).to.deep.equal([account1, account3]);
    });
  });

  describe('The socialAccountController controller', function() {
    var accountMock, notificationFactory;
    var provider = 'social';
    var notFoundError = 'Account Not Found';

    beforeEach(function() {
      accountMock = {
        data: { id: 1, provider: provider },
        remove: function() {
          return $q.when({});
        }
      };
      notificationFactory = {
        weakError: function() {},
        weakSuccess: function() {}
      };
    });

    function createController() {
      $controller('socialAccountController', {
        $scope: $scope,
        notificationFactory: notificationFactory,
        ACCOUNT_MESSAGES: ACCOUNT_MESSAGES,
        ACCOUNT_EVENTS: ACCOUNT_EVENTS
      });
    }

    it('should display error if can not delete account', function(done) {
      accountMock.remove = function() {
        return $q.when({ status: 500, data: { error: notFoundError } });
      };
      notificationFactory.weakError = function(title, text) {
        expect(text).to.equal(notFoundError);
        expect(title).to.equal(ACCOUNT_MESSAGES.delete_error);
        done();
      };
      createController();
      $scope.deleteAccount(accountMock);
      $rootScope.$digest();
      done(new Error());
    });

    it('should display info if account is deleted', function(done) {
      accountMock.remove = function() {
        return $q.when({ status: 204 });
      };
      notificationFactory.weakSuccess = function(title, text) {
        expect(text).to.equal(ACCOUNT_MESSAGES.deleted);
        done();
      };
      createController();
      $scope.deleteAccount(accountMock);
      $rootScope.$digest();
      done(new Error());
    });

    it('should emit event if account is deleted', function(done) {
      accountMock.remove = function() {
        return $q.when({ status: 204 });
      };
      notificationFactory.weakSuccess = function(title, text) {
        expect(text).to.equal(ACCOUNT_MESSAGES.deleted);
      };
      $scope.$on(ACCOUNT_EVENTS.DELETED, function() {
        done();
      });
      createController();
      $scope.deleteAccount(accountMock);
      $rootScope.$digest();
      done(new Error());
    });
  });
});
