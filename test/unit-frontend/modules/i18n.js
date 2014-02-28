'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The i18n angular module', function() {
  beforeEach(angular.mock.module('esn.i18n'));

  describe('localController', function() {

    beforeEach(angular.mock.inject(function(i18nAPI, $httpBackend, $rootScope, $controller) {
      this.i18nAPI = i18nAPI;
      this.$httpBackend = $httpBackend;
      this.locales = ['en', 'fr'];
      this.locale = 'en';

      this.scope = $rootScope.$new();
      $controller('localeController', {
        $scope: this.scope,
        i18nAPI: this.i18nAPI
      });
    }));

    it('should send a request GET to /locales/ and locales/current and return prettyLocales', function() {
      this.$httpBackend.expectGET('/locales/current').respond(this.locale);
      this.$httpBackend.expectGET('/locales').respond(this.locales);
      this.$httpBackend.flush();

      expect(this.scope.supportedLocales).to.include('English');
      expect(this.scope.supportedLocales).to.include('Français');
      expect(this.scope.supportedLocales.length).to.equal(2);
      expect(this.scope.selectedLocale).to.equal('English');
    });

    it('should send a request GET to /locales/locale with unPrettyLocale', function() {
      this.$httpBackend.expectGET('locales/en').respond(200);
      this.scope.setLocale('English');
    });
  });
});
