'use strict';

describe('The Contact Import Twitter directives', function() {

  beforeEach(function() {
    module('ngRoute');
    module('linagora.esn.contact.import.twitter');
    module('esn.core');
    module('jadeTemplates');
  });

  describe('The twitterContactImportMenuItem directive', function() {

    var TwitterContactImporterMock, notificationFactory, $scope, $rootScope, $compile;

    beforeEach(function() {
      notificationFactory = {};
      TwitterContactImporterMock = {};

      module(function($provide) {
        $provide.value('TwitterContactImporter', TwitterContactImporterMock);
        $provide.value('notificationFactory', notificationFactory);
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

      it('should notify when importing without error', function(done) {
        $scope.account = {
          provider: 'twitter',
          data: {
            username: 'awesomepaas'
          }
        };

        notificationFactory.notify = function(type) {
          if (type === 'info') {
            return done();
          }
          done(new Error());
        };

        TwitterContactImporterMock.import = function() {
          return $q.when({status: 202});
        };

        var element = initDirective();
        element.click();
        this.$rootScope.$digest();
      });

      it('should notify when import error', function(done) {
        $scope.account = {
          provider: 'twitter',
          data: {
            username: 'awesomepaas'
          }
        };

        notificationFactory.notify = function(type) {
          if (type === 'danger') {
            return done();
          }
          done(new Error());
        };

        TwitterContactImporterMock.import = function() {
          return $q.reject();
        };

        var element = initDirective();
        element.click();
        this.$rootScope.$digest();
      });
    });
  });
});
