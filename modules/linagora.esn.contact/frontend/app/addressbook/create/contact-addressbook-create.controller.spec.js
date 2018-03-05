'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ContactAddressbookCreateController', function() {
  var $rootScope, $controller;
  var contactAddressbookService;

  beforeEach(function() {
    module('linagora.esn.contact');

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
    var controller = $controller('ContactAddressbookCreateController', { $scope: $scope });

    $rootScope.$digest();

    return controller;
  }

  describe('The onCreateBtnClick function', function() {
    it('should reject if failed to create address book', function(done) {
      contactAddressbookService.createAddressbook = sinon.stub().returns($q.reject());

      var addressbook = { foo: 'bar' };
      var controller = initController();

      controller.addressbook = addressbook;
      controller.onCreateBtnClick()
        .catch(function() {
          expect(contactAddressbookService.createAddressbook).to.have.been.calledWith(addressbook);
          done();
        });

      $rootScope.$digest();
    });

    it('should resolve if success to create address book', function(done) {
      contactAddressbookService.createAddressbook = sinon.stub().returns($q.when());

      var addressbook = { foo: 'bar' };
      var controller = initController();

      controller.addressbook = addressbook;
      controller.onCreateBtnClick()
        .then(function() {
          expect(contactAddressbookService.createAddressbook).to.have.been.calledWith(addressbook);
          done();
        })
        .catch(function(err) {
          done(err || 'should resolve');
        });

      $rootScope.$digest();
    });
  });
});
