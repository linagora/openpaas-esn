'use strict';

describe('The Account Angular Services', function() {

  beforeEach(function() {
    module('ngRoute');
    module('esn.core');
    module('linagora.esn.account');
  });

  describe('The accountService service', function() {
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
