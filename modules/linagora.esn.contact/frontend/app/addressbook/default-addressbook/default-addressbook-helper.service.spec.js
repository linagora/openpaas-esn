'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contactDefaultAddressbookHelper service', function() {
  var contactDefaultAddressbookHelper;

  beforeEach(function() {
    module('esn.notification');
    module('linagora.esn.contact');
    inject(function(_contactDefaultAddressbookHelper_) {
      contactDefaultAddressbookHelper = _contactDefaultAddressbookHelper_;
    });
  });

  describe('The isDefaultAddressbook fn', function() {

    it('should return false when input shell is undefined or null', function() {
      expect(contactDefaultAddressbookHelper.isDefaultAddressbook()).to.be.false;
      expect(contactDefaultAddressbookHelper.isDefaultAddressbook(null)).to.be.false;
    });

    it('should return false when input shell has no addressbook field', function() {
      expect(contactDefaultAddressbookHelper.isDefaultAddressbook({})).to.be.false;
    });

    it('should return true when bookName is contacts', function() {
      var shell = {
        bookName: 'contacts'
      };

      expect(contactDefaultAddressbookHelper.isDefaultAddressbook(shell)).to.be.true;
    });
  });
});
