'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contact Import Twitter Services', function() {

  describe('The TwitterContactImporter service', function() {

    var ContactImporterMock;

    beforeEach(function() {
      module('linagora.esn.contact.import.twitter');
      module('esn.core');
    });

    beforeEach(function() {
      ContactImporterMock = {};
      module(function($provide) {
        $provide.value('ContactImporterService', ContactImporterMock);
      });

      inject(function($rootScope, $httpBackend, TwitterContactImporter) {
        this.$rootScope = $rootScope;
        this.$scope = $rootScope.$new();
        this.TwitterContactImporter = TwitterContactImporter;
      });
    });

    it('should call the ContactImporter', function() {
      var importContacts = sinon.spy();
      ContactImporterMock.import = importContacts;
      var account = {_id: 929292};
      this.TwitterContactImporter.import(account);
      this.$rootScope.$apply();
      expect(importContacts).to.have.been.calledWith('twitter', account);
    });
  });
});
