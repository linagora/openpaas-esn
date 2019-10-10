'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSettingsController', function() {
  var $q, $rootScope, $controller, $state, $stateParams;
  var contactAddressbookDisplayService, contactAddressbookService, addressbook;
  var CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS;

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
    _contactAddressbookDisplayService_,
    _CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $state = _$state_;
    $stateParams = _$stateParams_;
    contactAddressbookService = _contactAddressbookService_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS = _CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS_;

    $stateParams.bookName = 'collected';
    addressbook = {
      bookId: 'bookId',
      bookName: 'contacts',
      isSubscription: false,
      rights: {
        public: '{DAV:}read'
      },
      sharees: ['sharee1', 'sharee2']
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

    it('should get the members right if there is a group address book', function() {
      addressbook.rights = {
        members: CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS.READ.value
      };

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.membersRight).to.deep.equal(CONTACT_ADDRESSBOOK_MEMBERS_RIGHTS.READ.label);
    });

    it('should assign sharees to controller', function() {
      addressbook.sharees = ['share1', 'share2'];

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.sharees).to.deep.equal(addressbook.sharees);
    });

    it('should assign sharees of source to controller in case AB is a subscription', function() {
      addressbook.isSubscription = true;
      addressbook.source = {
        rights: {
          public: '{DAV:}write'
        },
        sharees: ['share1', 'share2']
      };

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.sharees).to.deep.equal(addressbook.source.sharees);
    });
  });

  describe('The onSave function', function() {
    it('should not update public right if it is not changed', function() {
      contactAddressbookService.updateAddressbookPublicRight = sinon.stub().returns($q.when({}));

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      controller.onSave();

      expect(contactAddressbookService.updateAddressbookPublicRight).to.not.have.been.called;
    });

    it('should update public right when it is changed', function() {
      contactAddressbookService.updateAddressbookPublicRight = sinon.stub().returns($q.when({}));

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      controller.publicRight = '{DAV:}write';

      controller.onSave();

      expect(contactAddressbookService.updateAddressbookPublicRight).to.have.been.calledWith(addressbook, '{DAV:}write');
    });

    it('should not update sharees if sharees is not changed', function() {
      addressbook.sharees = ['share1', 'share2'];

      contactAddressbookService.shareAddressbook = sinon.stub().returns($q.when({}));

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      controller.onSave();

      expect(contactAddressbookService.shareAddressbook).to.not.have.been.called;
    });

    it('should call contactAddressbookService.shareAddressbook to update sharees delegation if sharees information is changed', function() {
      contactAddressbookService.shareAddressbook = sinon.stub().returns($q.when({}));

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();
      controller.sharees.push('another sharee');

      controller.onSave();

      expect(contactAddressbookService.shareAddressbook).to.have.been.calledWith(sinon.match({
        bookId: addressbook.bookId,
        bookName: addressbook.bookName
      }), controller.sharees);
    });

    describe('when address book is subscription', function() {
      beforeEach(function() {
        addressbook.isSubscription = true;
        addressbook.source = {
          bookId: 'sourceBookId',
          bookName: 'sourceBookName',
          rights: {
            public: '{DAV:}write'
          },
          sharees: ['share1', 'share2']
        };
      });

      it('should not update public right if it is not changed', function() {
        contactAddressbookService.updateAddressbookPublicRight = sinon.stub().returns($q.when({}));

        var controller = initController();

        controller.$onInit();
        $rootScope.$digest();

        controller.onSave();

        expect(contactAddressbookService.updateAddressbookPublicRight).to.not.have.been.called;
      });

      it('should update public right of the source address book when it is changed', function() {
        contactAddressbookService.updateAddressbookPublicRight = sinon.stub().returns($q.when({}));

        var controller = initController();

        controller.$onInit();
        $rootScope.$digest();

        controller.publicRight = '{DAV:}read';
        controller.onSave();

        expect(contactAddressbookService.updateAddressbookPublicRight).to.have.been.calledWith(addressbook.source, controller.publicRight);
      });

      it('should not update sharees if sharees is not changed', function() {
        contactAddressbookService.shareAddressbook = sinon.stub().returns($q.when({}));

        var controller = initController();

        controller.$onInit();
        $rootScope.$digest();

        controller.onSave();

        expect(contactAddressbookService.shareAddressbook).to.not.have.been.called;
      });

      it('should update sharees of the source when the sharees is changed', function() {
        contactAddressbookService.shareAddressbook = sinon.stub().returns($q.when({}));

        var controller = initController();

        controller.$onInit();
        $rootScope.$digest();

        controller.sharees.push('another sharee');
        controller.onSave();

        expect(contactAddressbookService.shareAddressbook).to.have.been.calledWith(sinon.match({
          bookId: addressbook.source.bookId,
          bookName: addressbook.source.bookName
        }), controller.sharees);
      });
    });
  });

  describe('The onCancel function', function() {
    it('should redirect back to address book page', function() {
      $state.go = sinon.spy();

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      controller.onCancel();
      expect($state.go).to.have.been.calledWith('contact.addressbooks', {
        bookId: addressbook.bookId,
        bookName: addressbook.bookName
      }, {
        location: 'replace'
      });
    });
  });
});
