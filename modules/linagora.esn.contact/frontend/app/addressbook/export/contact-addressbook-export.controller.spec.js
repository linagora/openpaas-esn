'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactAddressbookExportController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookDisplayService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookDisplayService_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    });
  });

  function initController(addressbook) {
    var $scope = $rootScope.$new();

    return $controller('ContactAddressbookExportController', {
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

    controller.$onInit();

    expect(contactAddressbookDisplayService.convertShellToDisplayShell).to.have.been.called;
    expect(controller.addressbookDisplayShell).to.deep.equal(displayShell);
  });

  it('should build the export URL', function() {
    var addressbook = {
      bookId: '123',
      bookName: '456'
    };
    var controller = initController(addressbook);

    controller.$onInit();

    expect(controller.exportUrl).to.deep.equal('/dav/api/addressbooks/' + addressbook.bookId + '/' + addressbook.bookName + '?export');
  });

  it('should build the export URL if there is a subscribed address book', function() {
    var addressbook = {
      bookId: '123',
      bookName: '456',
      isSubscription: true,
      source: {
        bookId: 'soureBookId',
        bookName: 'sourceBookName'
      }
    };
    var controller = initController(addressbook);

    controller.$onInit();

    expect(controller.exportUrl).to.deep.equal('/dav/api/addressbooks/' + addressbook.source.bookId + '/' + addressbook.source.bookName + '?export');
  });
});
