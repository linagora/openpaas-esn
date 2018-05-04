'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSharedConfigurationItemController', function() {
  var $rootScope, $controller;
  var contactAddressbookDisplayService;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$controller_,
    _contactAddressbookDisplayService_
  ) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;

    contactAddressbookDisplayService.buildDisplayName = sinon.stub();
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSharedConfigurationItemController', { $scope: scope });

    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should build display name of shared address book from its source', function() {
      var addressbook = {
        isShared: true,
        source: { name: 'source AB' }
      };
      var controller = initController();

      contactAddressbookDisplayService.buildDisplayName.returns(addressbook.source.name);
      controller.addressbook = addressbook;
      controller.$onInit();

      expect(contactAddressbookDisplayService.buildDisplayName).to.have.been.calledWith(controller.addressbook.source);
      expect(controller.addressbookDisplayName).to.equal(controller.addressbook.source.name);
    });

    it('should build display name of non-shared address book from itself', function() {
      var addressbook = {
        isShared: false,
        name: 'My name'
      };
      var controller = initController();

      contactAddressbookDisplayService.buildDisplayName.returns(addressbook.name);
      controller.addressbook = addressbook;
      controller.$onInit();

      expect(contactAddressbookDisplayService.buildDisplayName).to.have.been.calledWith(controller.addressbook);
      expect(controller.addressbookDisplayName).to.equal(controller.addressbook.name);
    });
  });
});
