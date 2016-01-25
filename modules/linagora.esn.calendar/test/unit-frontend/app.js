'use strict';

describe('Calendar angular module', function() {

  beforeEach(function() {
    this.headerServiceMock = {};

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('headerService', self.headerServiceMock);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function($rootScope) {
      this.$rootScope = $rootScope;
    });
  });

  it('should call resetAllInjections every $stateChangeStart', function(done) {
    this.headerServiceMock.resetAllInjections = function() { done(); };
    this.$rootScope.$emit('$stateChangeStart');
    this.$rootScope.$digest();
  });
});
