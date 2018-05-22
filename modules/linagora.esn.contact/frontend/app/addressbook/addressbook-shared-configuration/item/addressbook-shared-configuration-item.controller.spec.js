'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSharedConfigurationItemController', function() {
  var $rootScope, $controller;
  var contactAddressbookDisplayService;
  var CONTACT_SHARING_SUBSCRIPTION_TYPE;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$controller_,
    _contactAddressbookDisplayService_,
    _CONTACT_SHARING_SUBSCRIPTION_TYPE_
  ) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    CONTACT_SHARING_SUBSCRIPTION_TYPE = _CONTACT_SHARING_SUBSCRIPTION_TYPE_;

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
        subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
        source: { name: 'source AB' }
      };
      var controller = initController();

      contactAddressbookDisplayService.buildDisplayName.returns(addressbook.source.name);
      controller.addressbook = addressbook;
      controller.$onInit();

      expect(contactAddressbookDisplayService.buildDisplayName).to.have.been.calledWith(controller.addressbook.source);
      expect(controller.addressbookDisplayName).to.equal(controller.addressbook.source.name);
    });

    it('should build display name of public address book from itself', function() {
      var addressbook = {
        subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.public,
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
