'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contactUserAddressbookService service', function() {
  var contactUserAddressbookService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_contactUserAddressbookService_) {
      contactUserAddressbookService = _contactUserAddressbookService_;
    });
  });

  describe('The isUserAddressbook function', function() {
    it('should return false when input shell is undefined or null', function() {
      expect(contactUserAddressbookService.isUserAddressbook()).to.equal(false);
      expect(contactUserAddressbookService.isUserAddressbook(null)).to.equal(false);
    });

    it('should return false when input shell has no type field', function() {
      expect(contactUserAddressbookService.isUserAddressbook({})).to.equal(false);
    });

    it('should return true when type is "user"', function() {
      var shell = {
        type: 'user'
      };

      expect(contactUserAddressbookService.isUserAddressbook(shell)).to.equal(true);
    });
  });
});
