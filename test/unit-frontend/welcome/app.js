'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The welcome app', function() {
  beforeEach(module('welcomeApp'));

  var location, route, rootScope, httpBackend;

  beforeEach(inject(function($location, $route, $rootScope, $httpBackend) {
    location = $location;
    route = $route;
    rootScope = $rootScope;
    httpBackend = $httpBackend;
  }));

  describe('route provider', function() {

    it('should load the finalize page when routing to /signup/anId', function() {
      var anId = 'testId';
      httpBackend.expectGET('/api/invitations/' + anId).respond(200);
      httpBackend.expectGET('/views/modules/invitation/finalize').respond(200);
      location.path('/signup/' + anId);
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/signup/:id');
      expect(route.current.pathParams).to.deep.equal({id: anId});
    });

    it('should load the home page when routing to /login', function() {
      httpBackend.expectGET('/views/welcome/partials/home').respond(200);
      location.path('/login');
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/login');
      expect(route.current.params).to.deep.equal({});
    });

    it('should load the home page when routing to /', function() {
      httpBackend.expectGET('/views/welcome/partials/home').respond(200);
      location.path('/');
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/');
      expect(route.current.params).to.deep.equal({});
    });

    it('should load the confirm page when routing to /confirm', function() {
      httpBackend.expectGET('/views/welcome/partials/confirm').respond(200);
      location.path('/confirm');
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/confirm');
      expect(route.current.params).to.deep.equal({});
    });

    it('should load the home page when routing to an unknown path and set the continue parameter', function() {
      httpBackend.expectGET('/views/welcome/partials/home').respond(200);
      var continuePath = '/pathForContinue';
      location.path(continuePath);
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/');
      expect(route.current.params).to.deep.equal({continue: continuePath});
    });
  });
});
