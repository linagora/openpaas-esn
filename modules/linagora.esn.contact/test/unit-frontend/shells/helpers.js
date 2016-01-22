'use strict';

/* global chai: false */
var expect = chai.expect;

describe('ContactShell Helpers', function() {

  var BOOK_ID = '123456789';
  var BOOK_NAME = 'contacts';
  var CARD_ID = 'mycardid';

  function getHref() {
    return '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + CARD_ID + '.vcf';
  }

  describe('The ContactShellHelper service', function() {

    beforeEach(function() {
      module('linagora.esn.contact');
    });

    beforeEach(function() {
      angular.mock.inject(function(ContactShellHelper) {
        this.ContactShellHelper = ContactShellHelper;
      });
    });

    describe('The getMetadata function', function() {
      it('should return undefined in shell is undefined', function() {
        expect(this.ContactShellHelper.getMetadata()).to.not.be.defined;
      });

      it('should return undefined in shell.href undefined', function() {
        expect(this.ContactShellHelper.getMetadata({})).to.not.be.defined;
      });

      it('should return valid informations when href is set', function() {
        expect(this.ContactShellHelper.getMetadata({href: getHref()})).to.deep.equals({
          cardId: CARD_ID,
          bookId: BOOK_ID,
          bookName: BOOK_NAME
        });
      });
    });
  });

  describe('The ContactShellDisplayBuilder service', function() {

    var DisplayShellProvider = {};

    beforeEach(function() {
      module('linagora.esn.contact', function($provide) {
        $provide.value('DisplayShellProvider', DisplayShellProvider);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function(ContactShellDisplayBuilder) {
        this.ContactShellDisplayBuilder = ContactShellDisplayBuilder;
      });
    });

    describe('The build function', function() {
      it('should set the current shell AB to the display one', function() {
        var addressbook = {
          bookId: 1,
          bookName: 'twitter'
        };

        var shell = {
          bar: 'baz',
          addressbook: addressbook
        };

        var built = {
          foo: 'bar'
        };

        DisplayShellProvider.convertToDisplayShell = function(_shell) {
          expect(_shell).to.deep.equal(shell);
          return built;
        };

        expect(this.ContactShellDisplayBuilder.build(shell).addressbook).to.deep.equals(addressbook);
      });
    });
  });
});
