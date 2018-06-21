'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactAddressbookImportController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookService, davImportServiceMock;

  beforeEach(function() {
    davImportServiceMock = {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('davImportService', davImportServiceMock);
    });
  });

  beforeEach(function() {
    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookService_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
    });
  });

  function initController() {
    var $scope = $rootScope.$new();
    var controller = $controller('ContactAddressbookImportController', { $scope: $scope });

    controller.$onInit();
    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should set status to "loading"', function() {
      var controller = $controller('ContactAddressbookImportController', { $scope: $rootScope.$new() });

      controller.$onInit();
      expect(controller.status).to.equal('loading');
    });

    it('should list address books that user can create contact in and the 1st one is selected by default', function() {
      var addressbook = {
        bookName: '123',
        name: 'adb-name'
      };
      var displayShell = {
        shell: addressbook,
        displayName: 'adb-name'
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([addressbook]));

      var controller = initController();

      expect(controller.status).to.equal('loaded');
      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(controller.addressbookDisplayShells).to.shallowDeepEqual([displayShell]);
      expect(controller.selectedAddressbookShell).to.deep.equal(addressbook);
    });

    it('should set status to "error" if failed to list address books', function() {
      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.reject('an error'));

      var controller = initController();

      expect(controller.status).to.equal('error');
    });
  });

  describe('The onFileSelect function', function() {
    it('should set file and check correct file type', function() {
      var addressbook = {
        bookName: '123',
        name: 'adb-name'
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([addressbook]));

      var controller = initController();
      var file = [{ type: 'text/vcard', length: 100 }];

      controller.onFileSelect(file);

      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(controller.file).to.deep.equal(file[0]);
      expect(controller.isValid).to.equal(true);
    });
  });

  describe('The doImport function', function() {
    it('should call davImportService.importFromFile with selected file and selected address book', function() {
      var addressbook = {
        bookId: '123',
        bookName: '456',
        name: 'adb-name'
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([addressbook]));

      var controller = initController();
      var file = [{ type: 'text/vcard', length: 100 }];

      controller.selectedAddressbookShell = addressbook;

      davImportServiceMock.importFromFile = sinon.stub().returns($q.when());

      controller.onFileSelect(file);
      controller.doImport();
      $rootScope.$digest();

      expect(davImportServiceMock.importFromFile).to.have.been.calledWith(file[0], '/addressbooks/123/456.json');
    });
  });
});
