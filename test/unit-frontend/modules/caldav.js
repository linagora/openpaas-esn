'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Caldav Angular module', function() {
  beforeEach(angular.mock.module('esn.caldav'));

  describe('The caldavAPI service', function() {

    beforeEach(angular.mock.inject(function(caldavAPI, $httpBackend, $rootScope) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.caldavAPI = caldavAPI;
    }));

    describe('The getCaldavServerURL fn', function() {
      it('should GET /api/caldavserver', function(done) {
        this.$httpBackend.expectGET('/caldavserver').respond({data: 'http://localhost'});
        this.caldavAPI.getCaldavServerURL().then(function(url) {
            expect(url).to.equal('http://localhost');
        }).finally (done);
        this.$httpBackend.flush();
        this.$rootScope.$apply();
      });
    });
  });
});
