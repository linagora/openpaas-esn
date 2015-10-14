'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Account Angular Controllers', function() {

  var $rootScope, $controller, $scope, SUPPORTED_ACCOUNTS;

  beforeEach(function() {
    angular.mock.module('ngRoute');
    angular.mock.module('linagora.esn.account');
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _SUPPORTED_ACCOUNTS_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    SUPPORTED_ACCOUNTS = _SUPPORTED_ACCOUNTS_;
    $scope = $rootScope.$new();
  }));

  describe('The accountListController controller', function() {

    var displayAccountMessage;
    var $location = {
    };

    function createController(accounts) {
      $controller('accountListController', {
        $scope: $scope,
        $location: $location,
        accounts: accounts,
        displayAccountMessage: displayAccountMessage,
        SUPPORTED_ACCOUNTS: SUPPORTED_ACCOUNTS
      });
    }

    it('should only keep the SUPPORTED_ACCOUNTS accounts', function() {
      $location.search = function() {return {};};
      var accounts = [
        {id: 'keep', type: 'oauth', data: {provider: 'twitter'}},
        {type: 'email'},
        {type: 'foo', data: {provider: 'bar'}}
      ];
      createController(accounts);
      $rootScope.$digest();

      expect($scope.accounts.length).to.equal(1);
      expect($scope.accounts[0].id).to.equal('keep');
    });

    it('should only keep the accounts with provider', function() {
      $location.search = function() {return {};};
      var accounts = [
        {id: 'notkeep', type: 'oauth', data: {noprovider: 'nop'}},
        {type: 'email'},
        {id: 'keep', type: 'oauth', data: {provider: 'bar'}}
      ];
      createController(accounts);
      $rootScope.$digest();

      expect($scope.accounts.length).to.equal(1);
      expect($scope.accounts[0].id).to.equal('keep');
    });

    it('should call displayAccountMessage is $location.search().status and status === error)', function(done) {
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
      createController(accounts);
      $rootScope.$digest();
    });

    it('should call displayAccountMessage is $location.search().status and status === denied)', function(done) {
      var provider = 'twitter';
      var status = 'denied';

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
      createController(accounts);
      $rootScope.$digest();
    });

    it('should not call displayAccountMessage is $location.search().status and status === success)', function(done) {
      var provider = 'twitter';
      var status = 'success';

      $location.search = function() {
        return {
          status: status,
          provider: provider
        };
      };
      displayAccountMessage = done;
      var accounts = [];
      createController(accounts);
      $rootScope.$digest();
      done();
    });
  });
});
