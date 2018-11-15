'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSettingsDelegationController', function() {
  var $q, $rootScope, $controller;
  var ContactSharee;
  var CONTACT_SHARING_SHARE_ACCESS;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$q_,
    _$rootScope_,
    _$controller_,
    _ContactSharee_,
    _CONTACT_SHARING_SHARE_ACCESS_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    ContactSharee = _ContactSharee_;
    CONTACT_SHARING_SHARE_ACCESS = _CONTACT_SHARING_SHARE_ACCESS_;
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSettingsDelegationController', { $scope: scope });

    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should load user information of all sharees', function() {
      var getUserMock = sinon.stub().returns($q.when());
      var controller = initController();

      controller.sharees = [{
        userId: '1',
        getUser: getUserMock
      }, {
        userId: '2',
        getUser: getUserMock
      }];

      controller.$onInit();
      $rootScope.$digest();

      expect(getUserMock).to.have.been.calledTwice;
      expect(controller.status).to.equal('loaded');
    });
  });

  describe('The onAddingUser function', function() {
    it('should return false if there is an existing delegation with the userId', function() {
      var controller = initController();

      controller.sharees = [{
        userId: 'user1',
        access: CONTACT_SHARING_SHARE_ACCESS.READ
      }];

      expect(controller.onAddingUser({ _id: 'user1' })).to.be.false;
    });

    it('should return false if the adding user is share owner', function() {
      var controller = initController();

      controller.sharees = [{
        userId: 'user1',
        access: CONTACT_SHARING_SHARE_ACCESS.SHAREDOWNER
      }];

      expect(controller.onAddingUser({ _id: 'user1' })).to.be.false;
    });

    it('should return true if there is no existing delegation with the userId', function() {
      var controller = initController();

      controller.sharees = [{
        userId: 'user1',
        access: CONTACT_SHARING_SHARE_ACCESS.READ
      }];

      expect(controller.onAddingUser({ _id: 'user2' })).to.be.true;
    });
  });

  describe('The onAddBtnClick function', function() {
    it('should update the list of sharees and reset the form', function() {
      ContactSharee.fromUser = sinon.spy(function(user, access) {
        return {
          user: user,
          access: access
        };
      });

      var controller = initController();

      controller.sharees = [{
        userId: 'user1',
        access: CONTACT_SHARING_SHARE_ACCESS.READ
      }];
      controller.newUsers = [{ _id: 'user1' }, { _id: 'user2' }];
      controller.selectedAccess = CONTACT_SHARING_SHARE_ACCESS.READWRITE;
      controller.onAddBtnClick();

      expect(controller.sharees).to.deep.equal([{
        user: { _id: 'user2' },
        access: CONTACT_SHARING_SHARE_ACCESS.READWRITE
      }, {
        user: { _id: 'user1' },
        access: CONTACT_SHARING_SHARE_ACCESS.READWRITE
      }]);
      expect(controller.newUsers).to.be.empty;
      expect(controller.selectedAccess).to.equal(CONTACT_SHARING_SHARE_ACCESS.READ);
    });
  });

  describe('The onRemoveShareeClick function', function() {
    it('should set the sharee access to NOACCESS', function() {
      var controller = initController();
      var sharee = { access: CONTACT_SHARING_SHARE_ACCESS.READ };

      controller.onRemoveShareeClick(sharee);

      expect(sharee.access).to.equal(CONTACT_SHARING_SHARE_ACCESS.NOACCESS);
    });

    it('should remove sharee if he is in share managers list', function() {
      var controller = initController();
      var userId1 = '1234';
      var userId2 = '6789';

      controller.shareManagers = [
        { _id: userId1 },
        { _id: userId2 }
      ];

      var sharee = { userId: userId1 };

      controller.onRemoveShareeClick(sharee);

      expect(controller.shareManagers).to.deep.equal([{
        _id: userId2
      }]);
    });
  });

  describe('The hasVisibleSharee function', function() {
    it('should return false if no sharee in the list is visible', function() {
      var controller = initController();

      controller.sharees = [{
        userId: '123',
        access: CONTACT_SHARING_SHARE_ACCESS.NOACCESS
      }, {
        userOd: '223',
        access: CONTACT_SHARING_SHARE_ACCESS.NOACCESS
      }];

      expect(controller.hasVisibleSharee()).to.be.false;
    });

    it('should return true if there is visible sharee in the list', function() {
      var controller = initController();

      controller.sharees = [{
        userId: '123',
        access: CONTACT_SHARING_SHARE_ACCESS.NOACCESS
      }, {
        userOd: '223',
        access: CONTACT_SHARING_SHARE_ACCESS.READ
      }];

      expect(controller.hasVisibleSharee()).to.be.true;
    });
  });

  describe('The isVisibbleSharee function', function() {
    it('should return true if the sharee access is READ', function() {
      var controller = initController();
      var sharee = { access: CONTACT_SHARING_SHARE_ACCESS.READ };

      expect(controller.isVisibbleSharee(sharee)).to.be.true;
    });

    it('should return true if the sharee access is READWRITE', function() {
      var controller = initController();
      var sharee = { access: CONTACT_SHARING_SHARE_ACCESS.READWRITE };

      expect(controller.isVisibbleSharee(sharee)).to.be.true;
    });

    it('should return false if the sharee access is not READWRITE or READ', function() {
      var controller = initController();
      var sharee = { userId: 'user' };

      expect(controller.isVisibbleSharee(sharee)).to.be.false;
    });
  });
});
