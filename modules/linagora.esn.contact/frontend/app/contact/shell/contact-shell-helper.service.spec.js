'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactShellHelper service', function() {
  var BOOK_ID = '123456789';
  var BOOK_NAME = 'contacts';
  var CARD_ID = 'mycardid';

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactShellHelper) {
      this.ContactShellHelper = ContactShellHelper;
    });
  });

  function getHref() {
    return '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + CARD_ID + '.vcf';
  }

  describe('The getMetadata function', function() {
    it('should return undefined in shell is undefined', function() {
      expect(this.ContactShellHelper.getMetadata()).to.not.be.defined;
    });

    it('should return valid informations when href is set', function() {
      expect(this.ContactShellHelper.getMetadata(getHref())).to.deep.equals({
        cardId: CARD_ID,
        bookId: BOOK_ID,
        bookName: BOOK_NAME
      });
    });
  });
});
