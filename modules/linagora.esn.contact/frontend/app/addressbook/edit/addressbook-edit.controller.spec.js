'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactAddressbookEditController controller', function() {
  var $rootScope, $controller, contactAddressbookService;

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {

      $provide.value('asyncAction', function(message, action) {
        return action();
      });
    });

    inject(function(_$controller_, _$rootScope_, _contactAddressbookService_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      contactAddressbookService = _contactAddressbookService_;
    });
  });

  function initController(addressbook) {
    var $scope = $rootScope.$new();

    return $controller('ContactAddressbookEditController', {
      $scope: $scope,
      addressbook: addressbook
    });
  }

  describe('The onSaveBtnClick function', function() {
    it('should call contactAddressbookService.updateAddressbook to update addressbook', function() {
      var addressbook = {
        bookName: 'book',
        name: 'addressbook'
      };
      var controller = initController(addressbook);

      contactAddressbookService.updateAddressbook = sinon.stub().returns($q.when());
      controller.addressbook.name = 'new name of addressbook';
      controller.onSaveBtnClick();

      expect(contactAddressbookService.updateAddressbook).to.have.been.calledWith({
        bookName: 'book',
        name: 'new name of addressbook'
      });
    });
  });
});
