'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ContactSidebarController controller', function() {
  var $rootScope, $controller, contactAddressbookService, contactAddressbookDisplayService;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact', function($provide) {
      contactAddressbookService = {};
      contactAddressbookDisplayService = {};

      $provide.value('contactAddressbookService', contactAddressbookService);
      $provide.value('contactAddressbookDisplayService', contactAddressbookDisplayService);
    });

    inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  function initController() {
    var $scope = $rootScope.$new();

    return $controller('ContactSidebarController', {$scope: $scope});
  }

  describe('$onInit fn', function() {
    it('should get the list of addressbooks then build the addressbook display shells', function() {
      var controller = initController();

      contactAddressbookService.listAddressbooks = sinon.stub().returns($q.when(['book1', 'book2']));
      contactAddressbookDisplayService.buildAddressbookDisplayShells = sinon.spy();

      controller.$onInit();
      $rootScope.$digest();

      expect(contactAddressbookService.listAddressbooks).to.have.been.called;
      expect(contactAddressbookDisplayService.buildAddressbookDisplayShells).to.have.been.calledWith(['book1', 'book2']);
    });
  });
});
