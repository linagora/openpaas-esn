'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSettingsMainController', function() {
  var $q, $rootScope, $controller;
  var CONTACT_SHARING_SUBSCRIPTION_TYPE, CONTACT_SHARING_SHARE_ACCESS;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$q_,
    _$rootScope_,
    _$controller_,
    _CONTACT_SHARING_SUBSCRIPTION_TYPE_,
    _CONTACT_SHARING_SHARE_ACCESS_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    CONTACT_SHARING_SUBSCRIPTION_TYPE = _CONTACT_SHARING_SUBSCRIPTION_TYPE_;
    CONTACT_SHARING_SHARE_ACCESS = _CONTACT_SHARING_SHARE_ACCESS_;
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSettingsMainController', { $scope: scope });

    scope.$digest();

    return controller;
  }

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
  });
});
