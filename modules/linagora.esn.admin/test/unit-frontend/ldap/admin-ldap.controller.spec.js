'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The adminLdapController', function() {
  var $controller, $rootScope, $stateParams, $scope;
  var adminDomainConfigService;
  var CONFIG_NAME = 'ldap';

  beforeEach(function() {
    module('linagora.esn.admin');

    inject(function(_$controller_, _$rootScope_, _$stateParams_, _adminDomainConfigService_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $stateParams = _$stateParams_;
      adminDomainConfigService = _adminDomainConfigService_;

      $stateParams.domainId = 'domain123';
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('adminLdapController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  it('should get LDAP configuration from server on init', function() {
    var config = { key: 'value' };

    adminDomainConfigService.get = sinon.stub().returns($q.when(config));

    var controller = initController();

    expect(controller.config).to.deep.equal(config);
    expect(adminDomainConfigService.get).to.have.been.calledWith($stateParams.domainId, CONFIG_NAME);
  });

  describe('The save fn', function() {
    var configMock;

    beforeEach(function() {
      configMock = { key: 'value' };

      adminDomainConfigService.get = function() {
        return $q.when(configMock);
      };
    });

    it('should call adminDomainConfigService.set to save configuration', function() {
      var controller = initController();

      adminDomainConfigService.set = sinon.stub().returns($q.when());
      controller.save();

      expect(adminDomainConfigService.set).to.have.been.calledWith($stateParams.domainId, {
        name: CONFIG_NAME,
        value: controller.config
      });
    });
  });
});
