'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactMaintenanceDomainMembersController controller', function() {
  var $controller, $rootScope;
  var contactMaintenanceDomainMembersService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_$controller_, _$rootScope_, _contactMaintenanceDomainMembersService_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactMaintenanceDomainMembersService = _contactMaintenanceDomainMembersService_;
    });
  });

  function initController($scope) {
    $scope = $scope || $rootScope.$new();

    var controller = $controller('contactMaintenanceDomainMembersController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The onSyncBtnClick method', function() {
    it('should reject if failed to synchronize domain members address books', function(done) {
      contactMaintenanceDomainMembersService.synchronize = sinon.stub().returns($q.reject());

      var controller = initController();

      controller.onSyncBtnClick()
        .then(function() {
          done('should not resolve');
        })
        .catch(function() {
          expect(contactMaintenanceDomainMembersService.synchronize).to.have.been.calledOnce;
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to synchronize domain members address books', function(done) {
      contactMaintenanceDomainMembersService.synchronize = sinon.stub().returns($q.when());

      var controller = initController();

      controller.onSyncBtnClick()
        .then(function() {
          expect(contactMaintenanceDomainMembersService.synchronize).to.have.been.calledOnce;
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });
});
