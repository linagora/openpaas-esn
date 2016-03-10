'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn app', function() {
  beforeEach(angular.mock.module('esnApp'));

  var location, state, rootScope, httpBackend, stateParams;

  beforeEach(inject(function($location, $state, $rootScope, $httpBackend, $stateParams) {
    location = $location;
    state = $state;
    rootScope = $rootScope;
    httpBackend = $httpBackend;
    location = $location;
    stateParams = $stateParams;
  }));

  describe('state provider', function() {

    it('should load the inbox page when routing to an unknown path and no continue parameter exists', function() {
      httpBackend.expectGET('/unifiedinbox/views/unifiedinbox').respond(200);
      location.path('/unknown');
      rootScope.$digest();
      expect(location.path()).to.equal('/unifiedinbox/inbox');
      expect(stateParams).to.deep.equal({});
    });

    it('should load the page from continue parameter when routing to an unknown path and the continue page exists', function() {
      httpBackend.expectGET('/api/user').respond(200);
      httpBackend.expectGET('/views/esn/partials/profile').respond(200);
      location.path('unknown');
      location.search({continue: '/profile'});
      rootScope.$digest();
      expect(location.path()).to.equal('/profile');
      expect(stateParams).to.deep.equal({});
    });

    it('should load the inbox page when routing to an unknown path and continue parameter is not an existing page', function() {
      httpBackend.expectGET('/unifiedinbox/views/unifiedinbox').respond(200);
      location.path('/unknown');
      location.search({continue: '/notAPage'});
      rootScope.$digest();
      expect(location.path()).to.equal('/unifiedinbox/inbox');
      expect(stateParams).to.deep.equal({});
    });

    it('should accept to have a trailing slash in the url, even when the state did not set it explicitly', function() {
      httpBackend.expectGET('/views/esn/partials/communities').respond(200);

      location.path('/communities/');
      rootScope.$digest();

      expect(location.path()).to.equal('/communities/');
    });

  });
});
