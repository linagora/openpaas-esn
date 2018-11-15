'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactAddressbookParser service', function() {
  var contactAddressbookParser;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_contactAddressbookParser_) {
      contactAddressbookParser = _contactAddressbookParser_;
    });
  });

  describe('The parseAddressbookPath function', function() {
    it('should extract metadata from addressbook path', function() {
      var path = '/esn-sabre/esn.php/addressbooks/2222/3333.json';
      var metadata = contactAddressbookParser.parseAddressbookPath(path);

      expect(metadata.bookId).to.equal('2222');
      expect(metadata.bookName).to.equal('3333');
    });

    it('should return empty if there is no matched metada in addressbook path', function() {
      var path = '/esn-sabre/addressbooks/invalid.json';
      var metadata = contactAddressbookParser.parseAddressbookPath(path);

      expect(metadata).to.be.empty;
    });
  });

  describe('The parsePrincipalPath function', function() {
    it('should extract data from addressbook path', function() {
      var path = 'principals/users/userId';
      var parsedPath = contactAddressbookParser.parsePrincipalPath(path);

      expect(parsedPath.type).to.equal('users');
      expect(parsedPath.id).to.equal('userId');
    });

    it('should return empty if there is no matched metada in addressbook path', function() {
      expect(contactAddressbookParser.parsePrincipalPath('invalid/path')).to.be.empty;
    });
  });
});
