'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Scroll Angular module', function() {

  beforeEach(angular.mock.module('esn.scroll'));

  describe('The keepScrollPosition directive', function() {
    var $location;
    var $timeout;
    var $scope;

    function doInject() {
      inject(function(_$location_, _$timeout_, $compile, $rootScope) {
        $location = _$location_;
        $timeout = _$timeout_;
        $scope = $rootScope.$new();
        $compile('<div keep-scroll-position></div>')($scope);
      });
    }

    it('should save scroll position on $locationChangeStart event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function() {
            return position;
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              put: function(key, value) {
                expect(key).to.equal(path, position);
                done();
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('$locationChangeStart');
    });

    it('should scroll to saved position on viewRenderFinished event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function(top) {
            expect(top).to.equal(position);
            done();
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              get: function(key) {
                expect(key).to.equal(path);
                return position;
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('viewRenderFinished');
      $timeout.flush();
    });

  });

  describe('The elementScrollDownService factory', function() {

    var $timeout, elementScrollDownService;

    beforeEach(inject(function(_$timeout_, _elementScrollDownService_) {
      $timeout = _$timeout_;
      elementScrollDownService = _elementScrollDownService_;
    }));

    describe('the autoScrollDown method with an element that has a scrollHeight attribute', function() {
      var element, scrollHeight, scrollTopSpy;
      beforeEach(function() {
        scrollTopSpy = sinon.spy();
        element = [{scrollHeight: scrollHeight}];
        element.scrollTop = scrollTopSpy;
      });

      it('should call the autoScrollDown method of the element passed as an argument', function() {
        elementScrollDownService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.be.called;
      });

      it('should not call the autoScrollDown method when no element is passed as an argument', function() {
        elementScrollDownService.autoScrollDown();
        $timeout.flush(1);
        expect(scrollTopSpy).to.not.be.called;
      });
    });

    describe('the autoScrollDown method with an element that does not have a scrollHeight attribute', function() {
      var element, scrollTopSpy;
      beforeEach(function() {
        scrollTopSpy = sinon.spy();
        element = {
          scrollTop: scrollTopSpy
        };
      });

      it('should not call the autoScrollDown method', function() {
        elementScrollDownService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.not.be.called;
      });
    });
  });
});
