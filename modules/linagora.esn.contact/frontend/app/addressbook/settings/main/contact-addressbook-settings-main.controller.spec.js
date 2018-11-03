'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSettingsMainController', function() {
  var $q, $rootScope, $controller;
  var CONTACT_SHARING_SUBSCRIPTION_TYPE, CONTACT_SHARING_SHARE_ACCESS;
  var contactAddressbookService;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$q_,
    _$rootScope_,
    _$controller_,
    _CONTACT_SHARING_SUBSCRIPTION_TYPE_,
    _CONTACT_SHARING_SHARE_ACCESS_,
    _contactAddressbookService_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    contactAddressbookService = _contactAddressbookService_;
    CONTACT_SHARING_SUBSCRIPTION_TYPE = _CONTACT_SHARING_SUBSCRIPTION_TYPE_;
    CONTACT_SHARING_SHARE_ACCESS = _CONTACT_SHARING_SHARE_ACCESS_;

    contactAddressbookService.getAddressbookUrl = function() {
      return $.when();
    };
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSettingsMainController', { $scope: scope });

    scope.$digest();

    return controller;
  }

  it('should call #contactAddressbookService.getAddressbook to set cardDAVUrl on init component', function() {
    var url = '/url';
    var addressbook = { foo: 'bar' };

    contactAddressbookService.getAddressbookUrl = sinon.stub().returns($q.when(url));

    var controller = initController();

    controller.addressbook = addressbook;
    controller.$onInit();
    $rootScope.$digest();

    expect(contactAddressbookService.getAddressbookUrl).to.have.been.calledWith(addressbook);
    expect(controller.cardDAVUrl).to.equal(url);
  });

  describe('The canUpdateMembersRight function', function() {
    it('should return false if user does not have share access', function() {
      var addressbook = {
        canShareAddressbook: false
      };

      var controller = initController();

      controller.addressbook = addressbook;

      expect(controller.canUpdateMembersRight()).to.be.false;
    });

    it('should return true if user has share access', function() {
      var addressbook = {
        canShareAddressbook: true
      };

      var controller = initController();

      controller.addressbook = addressbook;

      expect(controller.canUpdateMembersRight()).to.be.true;
    });
  });

  describe('The _initShareOwner fn', function() {
    it('should assign the share owner to controller', function() {
      var shareOwner = { id: 123 };
      var getUserSpy = sinon.stub().returns($q.when(shareOwner));
      var controller = initController();

      controller.addressbook = {
        subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
        source: {
          sharees: [{
            access: CONTACT_SHARING_SHARE_ACCESS.SHAREDOWNER,
            getUser: getUserSpy
          }]
        }
      };

      controller.$onInit();
      $rootScope.$digest();

      expect(getUserSpy).to.have.been.called;
      expect(controller.shareOwner).to.deep.equal(shareOwner);
    });

    it('should do nothing if the address book is not a delegation subscription', function() {
      var shareOwner = { id: 123 };
      var getUserSpy = sinon.stub().returns($q.when(shareOwner));
      var controller = initController();

      controller.addressbook = {
        subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.public,
        source: {
          sharees: [{
            access: CONTACT_SHARING_SHARE_ACCESS.SHAREDOWNER,
            getUser: getUserSpy
          }]
        }
      };

      controller.$onInit();
      $rootScope.$digest();

      expect(getUserSpy).to.not.have.been.called;
      expect(controller.shareOwner).to.not.be.defined;
    });

    it('should do nothing if the address book is a delegation subscription of domain address book', function() {
      var getUserSpy = sinon.spy();
      var controller = initController();

      controller.addressbook = {
        subscriptionType: CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation,
        source: {
          sharees: [{
            access: CONTACT_SHARING_SHARE_ACCESS.READ,
            getUser: getUserSpy
          }]
        }
      };

      controller.$onInit();
      $rootScope.$digest();

      expect(getUserSpy).to.not.have.been.called;
      expect(controller.shareOwner).to.be.undefined;
    });
  });
});
