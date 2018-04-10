'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactAddressbookSharedConfigurationController', function() {
  var $rootScope, $controller;
  var contactAddressbookService;
  var user, subscribableAddressbooks, subscribedAddressbooks;

  beforeEach(function() {
    module('esn.async-action', function($provide) {
      $provide.value('asyncAction', function(message, action) {
        return action();
      });
    });
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$controller_,
    _asyncAction_,
    _contactAddressbookService_
  ) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    contactAddressbookService = _contactAddressbookService_;

    user = { _id: '123' };
    subscribableAddressbooks = [
      {
        bookId: '123',
        bookName: 'contacts'
      },
      {
        bookId: '123',
        bookName: 'collected'
      }
    ];
    subscribedAddressbooks = [
      {
        source: {
          bookId: '789',
          bookName: 'subscribed'
        }
      },
      {
        source: {
          bookId: '123',
          bookName: 'contacts'
        }
      }
    ];
  }));

  function initController() {
    var scope = $rootScope.$new();
    var controller = $controller('contactAddressbookSharedConfigurationController', { $scope: scope });

    $rootScope.$digest();

    return controller;
  }

  describe('The onUserAdded function', function() {
    it('should filter out subscribed address books and append the subscribable address books of input user to the subscribable address book list', function() {
      var controller = initController();

      contactAddressbookService.listSubscribableAddressbooks = sinon.stub().returns($q.when(subscribableAddressbooks));
      contactAddressbookService.listSubscribedAddressbooks = sinon.stub().returns($q.when(subscribedAddressbooks));

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(contactAddressbookService.listSubscribableAddressbooks).to.have.been.calledWith(user._id);
      expect(contactAddressbookService.listSubscribedAddressbooks).to.have.been.called;
      expect(controller.addressbooksPerUser).to.deep.equal([
        {
          bookId: '123',
          bookName: 'collected',
          user: user
        }
      ]);
    });
  });

  describe('The onUserRemoved function', function() {
    it('should remove address books of removed user from subscribable address book list', function() {
      var controller = initController();

      contactAddressbookService.listSubscribableAddressbooks = sinon.stub().returns($q.when(subscribableAddressbooks));
      contactAddressbookService.listSubscribedAddressbooks = sinon.stub().returns($q.when([]));

      controller.onUserAdded(user);
      $rootScope.$digest();

      expect(contactAddressbookService.listSubscribableAddressbooks).to.have.been.calledWith(user._id);
      expect(contactAddressbookService.listSubscribedAddressbooks).to.have.been.called;
      expect(controller.addressbooksPerUser).to.deep.equal([
        {
          bookId: '123',
          bookName: 'contacts',
          user: user
        },
        {
          bookId: '123',
          bookName: 'collected',
          user: user
        }
      ]);

      controller.onUserRemoved(user);
      expect(controller.addressbooksPerUser).to.deep.equal([]);
    });
  });

  describe('The subscribe function', function() {
    it('should call contactAddressbookService.subscribeAddressbooks with selected address books', function() {
      var controller = initController();

      contactAddressbookService.listSubscribableAddressbooks = sinon.stub().returns($q.when(subscribableAddressbooks));
      contactAddressbookService.listSubscribedAddressbooks = sinon.stub().returns($q.when([]));
      contactAddressbookService.subscribeAddressbooks = sinon.spy();

      controller.onUserAdded(user);
      $rootScope.$digest();

      controller.addressbooksPerUser[0].isSelected = true;
      controller.addressbooksPerUser[1].isSelected = false;

      controller.subscribe();
      expect(contactAddressbookService.listSubscribableAddressbooks).to.have.been.calledWith(user._id);
      expect(contactAddressbookService.listSubscribedAddressbooks).to.have.been.called;
      expect(contactAddressbookService.subscribeAddressbooks).to.have.been.calledWith([controller.addressbooksPerUser[0]]);
    });
  });
});
