'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Scroll Angular module', function() {

  var subHeaderHasInjections, ESN_SUBHEADER_HEIGHT_MD = 47;

  beforeEach(angular.mock.module('esn.scroll', function($provide) {
    subHeaderHasInjections = false;

    $provide.decorator('$window', function($delegate) {
      $delegate.scrollTo = sinon.spy();

      return $delegate;
    });

    $provide.value('subHeaderService', {
      isVisible: function() {
        return subHeaderHasInjections;
      }
    });
    $provide.value('ESN_SUBHEADER_HEIGHT_MD', ESN_SUBHEADER_HEIGHT_MD);
  }));

  describe('The esnScrollListenerService factory', function() {

    var esnScrollListenerService;

    beforeEach(inject(function(_esnScrollListenerService_) {
      esnScrollListenerService = _esnScrollListenerService_;
    }));

    it('should act as a registry', function() {
      esnScrollListenerService.bindTo('.my-component');
      esnScrollListenerService.bindTo('.my-second-component');

      expect(esnScrollListenerService.getAllBoundSelectors()).to.deep.equal(['.my-component', '.my-second-component']);
    });

  });

  describe('The scrollListener directive', function() {

    var $scope;

    beforeEach(function() {
      module('esn.scroll');
    });

    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope.$new();
      $scope.setToDOM = true;

      $compile('<div scroll-listener ng-if="setToDOM" on-destroy="destroyed()" on-scroll-top="onTop"></div>')($scope);

      $scope.$digest();
    }));

    it('should call on-destroy when the directive is removed from the DOM', function() {
      $scope.destroyed = sinon.spy();

      $scope.setToDOM = false;
      $scope.$digest();

      expect($scope.destroyed).to.have.been.calledOnce;
    });

  });

  describe('The keepScrollPosition directive', function() {
    var path = '/a/path/here', position = 100;
    var $cacheFactory, $timeout, $scope, SCROLL_CACHE_KEY;

    function doInject() {
      inject(function(_$cacheFactory_, _$timeout_, $compile, $rootScope, _SCROLL_CACHE_KEY_) {
        $cacheFactory = _$cacheFactory_;
        $timeout = _$timeout_;
        SCROLL_CACHE_KEY = _SCROLL_CACHE_KEY_;
        $scope = $rootScope.$new();

        $compile('<div keep-scroll-position></div>')($scope);
      });
    }

    it('should save scroll position on $locationChangeStart event', function() {
      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.absUrl = function() {
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
      });

      doInject();
      $scope.$digest();

      $scope.$emit('$locationChangeStart', '', path);

      expect($cacheFactory.get(SCROLL_CACHE_KEY).get(path)).to.equal(position);
    });

    it('should scroll to saved position on $locationChangeSuccess event', function(done) {
      module('esn.scroll', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.absUrl = function() {
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
      });

      doInject();
      $scope.$digest();
      $cacheFactory.get(SCROLL_CACHE_KEY).put(path, position);

      $scope.$emit('$locationChangeSuccess', path);
      $timeout.flush();
    });

  });

  describe('The elementScrollService factory', function() {

    var $timeout, elementScrollService;

    beforeEach(inject(function(_$timeout_, _elementScrollService_) {
      $timeout = _$timeout_;
      elementScrollService = _elementScrollService_;

      $.fn.animate = sinon.spy($.fn.animate);
    }));

    describe('the autoScrollDown method with an element that has a scrollHeight attribute', function() {
      var element, scrollHeight, scrollTopSpy;
      beforeEach(function() {
        scrollTopSpy = sinon.spy();
        element = [{scrollHeight: scrollHeight}];
        element.scrollTop = scrollTopSpy;
      });

      it('should call the autoScrollDown method of the element passed as an argument', function() {
        elementScrollService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.be.called;
      });

      it('should not call the autoScrollDown method when no element is passed as an argument', function() {
        elementScrollService.autoScrollDown();
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
        elementScrollService.autoScrollDown(element);
        $timeout.flush(1);
        expect(scrollTopSpy).to.not.be.called;
      });
    });

    describe('The scrollDownToElement function', function() {

      var $window, elementScrollService;

      function elementWithOffset(offset) {
        return {
          offset: function() {
            return {
              top: offset
            };
          }
        };
      }

      beforeEach(inject(function(_$window_, _elementScrollService_) {
        $window = _$window_;
        elementScrollService = _elementScrollService_;
      }));

      it('should scroll to top, then down to the element offsetTop', function() {
        elementScrollService.scrollDownToElement(elementWithOffset(100));

        expect($window.scrollTo).to.have.been.calledWith(0, 0);
        expect($window.scrollTo).to.have.been.calledWith(0, 100);
      });

      it('should consider the subHeader, if injections are active', function() {
        subHeaderHasInjections = true;

        elementScrollService.scrollDownToElement(elementWithOffset(100));

        expect($window.scrollTo).to.have.been.calledWith(0, 0);
        expect($window.scrollTo).to.have.been.calledWith(0, 100 - ESN_SUBHEADER_HEIGHT_MD);
      });

    });

    describe('The scrollToTop function', function() {

      var deviceDetector, esnScrollListenerService;

      beforeEach(inject(function(_deviceDetector_, _esnScrollListenerService_) {
        deviceDetector = _deviceDetector_;
        esnScrollListenerService = _esnScrollListenerService_;
      }));

      it('should scroll to top with a jquery animation with a speed of 250ms on desktop', function() {
        deviceDetector.isMobile = sinon.stub().returns(false);

        elementScrollService.scrollToTop();

        expect($.fn.animate).to.have.been.calledWith(sinon.match.any, 250);
      });

      it('should scroll to top with a jquery animation with a speed of 0 on mobile', function() {
        deviceDetector.isMobile = sinon.stub().returns(true);

        elementScrollService.scrollToTop();

        expect($.fn.animate).to.have.been.calledWith(sinon.match.any, 0);
      });

      it('should scroll to top body and all registered element selectors', function() {
        esnScrollListenerService.bindTo('.my-component');

        elementScrollService.scrollToTop();

        expect($.fn.animate).to.have.been.calledTwice;
      });
    });

  });

  describe('The scrollTopOnClick directive', function() {
    var $scope, $window, element;

    beforeEach(function() {
      module('esn.scroll');
    });

    beforeEach(inject(function(_$compile_, _$rootScope_, _$window_) {
      $window = _$window_;
      $scope = _$rootScope_.$new();
      element = _$compile_('<div scroll-to-on-click></div>')($scope);
      $scope.$digest();
    }));

    it('should scroll to top when the element is clicked', function() {
      var windowElt = angular.element($window);
      $window.scrollTo(500);
      element.click();
      expect(windowElt.scrollTop()).to.equal(0);
    });
  });

});
