'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSettingsController', function() {
  var $q, $rootScope, $controller, $state, $stateParams;
  var contactAddressbookDisplayService, contactAddressbookService, addressbook;

  beforeEach(function() {
    module('esn.async-action', function($provide) {
      $provide.value('asyncAction', function(message, action) {
        return action();
      });
    });
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$q_,
    _$rootScope_,
    _$controller_,
    _$state_,
    _$stateParams_,
    _asyncAction_,
    _contactAddressbookService_,
    _contactAddressbookDisplayService_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $state = _$state_;
    $stateParams = _$stateParams_;
    contactAddressbookService = _contactAddressbookService_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;

    $stateParams.bookName = 'collected';
    addressbook = {
      bookName: 'contacts',
      isSubscription: false,
      rights: {
        public: '{DAV:}read'
      }
    };
    contactAddressbookDisplayService.buildDisplayName = sinon.stub().returns('My contacts');
    contactAddressbookService.getAddressbookByBookName = sinon.stub().returns($q.when(addressbook));
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSettingsController', { $scope: scope });

    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should call contactAddressbookService with bookName from $stateParams to get address book', function() {
      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(contactAddressbookDisplayService.buildDisplayName).to.have.been.calledOnce;
      expect(contactAddressbookService.getAddressbookByBookName).to.have.been.calledWith('collected');
      expect(controller.addressbook).to.deep.equal(addressbook);
    });

    it('should get the public right from source address book if the address book is subscription', function() {
      addressbook.isSubscription = true;
      addressbook.rights = {
        public: '{DAV:}read'
      };
      addressbook.source = {
        rights: {
          public: '{DAV:}write'
        }
      };

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.publicRight).to.equal('{DAV:}write');
    });
  });

  describe('The onSave function', function() {
    it('should call contactAddressbookService.updateAddressbookPublicRight to update public right if public right changed', function() {
      contactAddressbookService.updateAddressbookPublicRight = sinon.stub().returns($q.when({}));
      $state.go = sinon.stub().returns();

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      controller.publicRight = '{DAV:}write';

      controller.onSave();
      $rootScope.$digest();

      expect(contactAddressbookService.updateAddressbookPublicRight).to.have.been.calledWith(addressbook, '{DAV:}write');
    });

    it('should call contactAddressbookService.shareAddressbook to update sharees delegation if sharees information is changed', function() {
      contactAddressbookService.shareAddressbook = sinon.stub().returns($q.when({}));
      $state.go = angular.noop;

      var controller = initController();
      var changedAddressbook = {
        sharees: ['user1', 'user2']
      };

      controller.$onInit();
      $rootScope.$digest();
      controller.addressbook = changedAddressbook;

      controller.onSave();
      $rootScope.$digest();

      expect(contactAddressbookService.shareAddressbook).to.have.been.calledWith(changedAddressbook);
    });
  });

  describe('The onCancel function', function() {
    it('should redirect back to address book page', function() {
      $state.go = sinon.spy();

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      controller.onCancel();
      expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookName: addressbook.bookName }, { location: 'replace' });
    });
  });
});
