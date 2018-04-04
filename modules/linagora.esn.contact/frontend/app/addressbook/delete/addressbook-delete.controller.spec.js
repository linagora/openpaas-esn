'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('the ContactAddressbookDeleteController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookService, contactAddressbookDisplayService;

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('asyncAction', function(message, action) {
        return action();
      });
    });

    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookService_,
      _contactAddressbookDisplayService_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    });
  });

  function initController(addressbook) {
    var $scope = $rootScope.$new();

    return $controller('ContactAddressbookDeleteController', {
      $scope: $scope,
      addressbook: addressbook
    });
  }

  it('should convert addressbook to addressbookDisplayShell to get addressbook display name', function() {
    var addressbook = {
      bookName: '123'
    };
    var displayShell = {
      shell: addressbook,
      displayName: 'toto'
    };

    contactAddressbookDisplayService.convertShellToDisplayShell = sinon.spy(function() {
      return displayShell;
    });

    var controller = initController(addressbook);

    expect(contactAddressbookDisplayService.convertShellToDisplayShell).to.have.been.called;
    expect(controller.addressbookDisplayShell).to.deep.equal(displayShell);
  });

  describe('The onDeleteBtnClick function', function() {
    it('should call contactAddressbookService.removeAddressbook to remove addressbook', function() {
      var addressbook = {
        bookName: 'book',
        name: 'addressbook'
      };

      contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
      var controller = initController(addressbook);

      contactAddressbookService.removeAddressbook = sinon.spy();
      controller.onDeleteBtnClick();

      expect(contactAddressbookService.removeAddressbook).to.have.been.calledWith(addressbook);
    });
  });
});
