'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contactGroupAddressbookService service', function() {
  var contactGroupAddressbookService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_contactGroupAddressbookService_) {
      contactGroupAddressbookService = _contactGroupAddressbookService_;
    });
  });

  describe('The isGroupAddressbook function', function() {
    it('should return false when input shell is undefined or null', function() {
      expect(contactGroupAddressbookService.isGroupAddressbook()).to.be.false;
      expect(contactGroupAddressbookService.isGroupAddressbook(null)).to.be.false;
    });

    it('should return false when input shell has no type field', function() {
      expect(contactGroupAddressbookService.isGroupAddressbook({})).to.be.false;
    });

    it('should return true when type is "group"', function() {
      var shell = {
        type: 'group'
      };

      expect(contactGroupAddressbookService.isGroupAddressbook(shell)).to.be.true;
    });
  });
});
