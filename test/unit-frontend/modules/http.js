'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.http Angular module', function() {

  beforeEach(function() {
    module('esn.http');
  });

  describe('The httpErrorHandler service', function() {
    var windowMock, locationMock;

    beforeEach(module(function($provide) {
      windowMock = {
        addEventListener: angular.noop
      };
      locationMock = {
        url: function() {}
      };
      $provide.value('$window', windowMock);
      $provide.value('$location', locationMock);
    }));

    beforeEach(angular.mock.inject(function(httpErrorHandler) {
      this.httpErrorHandler = httpErrorHandler;
    }));

    describe('The redirectToLogin function', function() {

      it('should change current window.location.path', function() {
        var path = '/foo/bar/baz';

        locationMock.path = sinon.stub().returns(path);
        locationMock.hash = sinon.stub().returns('');
        windowMock.location = {};

        this.httpErrorHandler.redirectToLogin();

        expect(windowMock.location.href).to.equal('/login?continue=#' + path);
        expect(locationMock.path).to.have.been.calledOnce;
      });
    });
  });

  describe('The redirectWhenNotAuthInterceptor service', function() {
    var httpErrorHandler;

    beforeEach(module(function($provide) {
      httpErrorHandler = {};
      $provide.value('httpErrorHandler', httpErrorHandler);
    }));

    beforeEach(angular.mock.inject(function(redirectWhenNotAuthInterceptor, $rootScope) {
      this.redirectWhenNotAuthInterceptor = redirectWhenNotAuthInterceptor;
      this.$rootScope = $rootScope;
    }));

    describe('The responseError function', function() {

      it('should call redirectToLogin when HTTP 401 and reject', function(done) {
        httpErrorHandler.redirectToLogin = sinon.spy();

        this.redirectWhenNotAuthInterceptor.responseError({status: 401}).then(function() {
          done(new Error());
        }, function() {
          expect(httpErrorHandler.redirectToLogin).to.have.been.called;
          done();
        });
        this.$rootScope.$digest();
      });

      it('should reject when HTTP !== 401', function(done) {
        this.redirectWhenNotAuthInterceptor.responseError({status: 400}).then(function() {
          done();
        }, function() {
          done();
        });
        this.$rootScope.$digest();
      });
    });
  });
});
