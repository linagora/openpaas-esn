'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Import Twitter directives', function() {

  beforeEach(function() {
    module('linagora.esn.contact.import.twitter');
    module('esn.core');
    module('jadeTemplates');
  });

  describe('The twitterContactImportMenuItem directive', function() {

    var ContactImporterMock, $scope, $rootScope, $compile;

    beforeEach(function() {
      ContactImporterMock = {};

      module(function($provide) {
        $provide.value('ContactImporter', ContactImporterMock);
      });

      inject(function(_$compile_, _$rootScope_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $compile = _$compile_;
      });
    });

    function initDirective() {
      var element = $compile('<twitter-contact-import-menu-item/>')($scope);
      $scope.$digest();
      return element;
    }

    describe('The importContacts fn', function() {

      it('should call the ContactImporter import function', function(done) {
        $scope.account = {
          _id: 123,
          provider: 'twitter',
          data: {
            username: 'awesomepaas'
          }
        };

        ContactImporterMock.import = function(type, account) {
          expect(account).to.deep.equal($scope.account);
          done();
        };

        var element = initDirective();
        element.click();
        this.$rootScope.$digest();
      });
    });
  });
});
