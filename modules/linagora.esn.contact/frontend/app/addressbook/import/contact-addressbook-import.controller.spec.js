'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactAddressbookImportController controller', function() {
  var $rootScope, $controller;
  var contactAddressbookService, contactService, esnConfigMock;

  beforeEach(function() {
    module('linagora.esn.contact');
    module(function($provide) {
      esnConfigMock = function() {
        return $q.when(true);
      };

      $provide.value('esnConfig', esnConfigMock);
    });

    inject(function(
      _$controller_,
      _$rootScope_,
      _contactAddressbookService_,
      _contactService_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
      contactService = _contactService_;
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
    it('should not set file if file type is incorrect', function() {
      var addressbook = {
        bookName: '123',
        name: 'adb-name'
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([addressbook]));

      var controller = initController();
      var file = [{ type: 'text/incorrect', length: 100 }];

      controller.onFileSelect(file);

      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(controller.file).to.be.null;
      expect(controller.isValid).to.be.false;
    });

    it('should set file if file type is text/vcard', function() {
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
      expect(controller.isValid).to.be.true;
    });

    it('should set file if file type is text/x-vcard', function() {
      var addressbook = {
        bookName: '123',
        name: 'adb-name'
      };

      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([addressbook]));

      var controller = initController();
      var file = [{ type: 'text/x-vcard', length: 100 }];

      controller.onFileSelect(file);

      expect(contactAddressbookService.listAddressbooksUserCanCreateContact).to.have.been.called;
      expect(controller.file).to.deep.equal(file[0]);
      expect(controller.isValid).to.be.true;
    });
  });

  describe('The doImport function', function() {
    it('should call contactService.importContactsFromFile with selected file and selected address book', function() {
      contactAddressbookService.listAddressbooksUserCanCreateContact = sinon.stub().returns($q.when([{}]));

      var controller = initController();
      var file = [{ type: 'text/vcard', length: 100 }];

      contactService.importContactsFromFile = sinon.stub().returns($q.when());

      controller.onFileSelect(file);
      controller.doImport();
      $rootScope.$digest();

      expect(contactService.importContactsFromFile).to.have.been.calledWith(controller.selectedAddressbookShell, file[0]);
    });
  });
});
