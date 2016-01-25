'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The box-overlay Angular module', function() {

  var $window, $compile, $rootScope, $scope, $timeout, element,
      deviceDetector, DEVICES;

  function compile(html) {
    element = $compile(html)($scope);
    $scope.$digest();

    return element;
  }

  function compileAndClickTheButton(html) {
    compile(html);

    return clickTheButton(element);
  }

  function clickTheButton(button) {
    button.click();
    $rootScope.$digest();
    return button;
  }

  function closeFirstBox() {
    var closeButton = angular.element('.box-overlay-open i.close').first();
    closeButton.triggerHandler('click');
    $timeout.flush();
  }

  function getMaximizeButton() {
    return angular.element('.box-overlay-open .toggle-maximize').first();
  }

  function maximizeFirstBox() {
    getMaximizeButton().click();
  }

  function minimizeFirstBox() {
    angular.element('.box-overlay-open .toggle-minimize').first().click();
  }

  function triggerEventOnFirstInputElement(event) {
    angular.element('.box-overlay-open input').first().trigger({type: event});
    $scope.$digest();
  }

  function touchFirstInputElement() {
    triggerEventOnFirstInputElement('touchstart');
  }

  function focusFirstInputElement() {
    triggerEventOnFirstInputElement('focus');
  }

  function overlays() {
    return angular.element('.box-overlay-open');
  }

  beforeEach(module('jadeTemplates'));

  beforeEach(function() {
    angular.mock.module('esn.box-overlay');
  });

  afterEach(function() {
    angular.element('.box-overlay-container').remove();
  });

  describe('boxOverlay directive', function() {

    var $httpBackend;

    beforeEach(inject(function(_$window_, _$compile_, _$rootScope_, _$httpBackend_, _$timeout_,
        _deviceDetector_, _DEVICES_) {
      $window = _$window_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
      $timeout = _$timeout_;
      deviceDetector = _deviceDetector_;
      DEVICES = _DEVICES_;

      deviceDetector.device = DEVICES.ANDROID;
    }));

    afterEach(function() {
      overlays().remove(); // Removes all overlays that might have been left in the DOM
    });

    it('should display the overlay when the calling element is clicked', function() {
      compileAndClickTheButton('<button box-overlay />');

      expect(overlays()).to.have.length(1);
    });

    it('should correctly fetch a custom template, and add it to the overlay', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<div class="i-am-the-template">Test</div>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();

      expect(overlays().find('.i-am-the-template')).to.have.length(1);
    });

    it('should display the title in the overlay', function() {
      compileAndClickTheButton('<button box-overlay box-title="The title !" />');

      expect(overlays().find('.panel-title').text()).to.match(/The title !/);
    });

    it('should not try to focus when no element has the autofocus attr in the template', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<div class="i-am-the-template">Test</div>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-the-template')).to.have.length(1);
    });

    it('should focus an autofocus element found in the template', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<input class="i-am-the-template" autofocus>Test</input>');

      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-the-template')[0]).to.equal(document.activeElement);
    });

    it('should focus the autofocus element of a newly shown overlay', function() {
      $httpBackend.expectGET('/path/to/the/template').respond('<input class="i-am-the-template" autofocus>Test</input>');
      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
      $httpBackend.flush();
      $timeout.flush();

      $httpBackend.expectGET('/path/to/another/template').respond('<input class="i-am-another-template" autofocus>Test</input>');
      compileAndClickTheButton('<button box-overlay box-template-url="/path/to/another/template" />');
      $httpBackend.flush();
      $timeout.flush();

      expect(overlays().find('.i-am-another-template')[0]).to.equal(document.activeElement);
    });

    it('should accept to open two boxes', function() {

      var notificationCount = 0;
      $rootScope.$on('box-overlay:no-space-left-on-screen', function() {
        notificationCount++;
      });

      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
      expect(notificationCount).to.equal(1);
    });

    it('should not accept to have three boxes', function() {
      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
    });

    it('should accept to reopen a box when one has been closed', function() {
      var notificationCount = 0;
      $rootScope.$on('box-overlay:space-left-on-screen', function() {
        notificationCount++;
      });

      var button = compileAndClickTheButton('<button box-overlay />');
      clickTheButton(button);
      closeFirstBox();
      clickTheButton(button);

      expect(overlays()).to.have.length(2);
      expect(notificationCount).to.equal(1);
    });

    it('should set the "maximized" CSS class when the box is maximized', function() {
      compileAndClickTheButton('<button box-overlay />');
      maximizeFirstBox();

      expect(overlays().first().hasClass('maximized')).to.equal(true);
      expect(overlays().first().hasClass('minimized')).to.equal(false);
    });

    it('should set the "minimized" CSS class when the box is minimized', function() {
      compileAndClickTheButton('<button box-overlay />');
      minimizeFirstBox();

      expect(overlays().first().hasClass('minimized')).to.equal(true);
      expect(overlays().first().hasClass('maximized')).to.equal(false);
    });

    it('should minimize other boxes when a box is maximized', function() {
      compileAndClickTheButton('<button box-overlay />');
      compileAndClickTheButton('<button box-overlay />');
      maximizeFirstBox();

      expect(overlays().first().hasClass('maximized')).to.equal(true);
      expect(overlays().first().hasClass('minimized')).to.equal(false);
      expect(overlays().last().hasClass('maximized')).to.equal(false);
      expect(overlays().last().hasClass('minimized')).to.equal(true);
    });

    describe('when the device is an ipad', function() {

      beforeEach(function() {
        deviceDetector.device = DEVICES.I_PAD;

        $httpBackend.expectGET('/path/to/the/template').respond('<input>Test</input>');
        compileAndClickTheButton('<button box-overlay box-template-url="/path/to/the/template" />');
        $httpBackend.flush();
      });

      it('should automatically open as maximize', function() {
        expect(overlays().first().hasClass('maximized')).to.equal(true);
      });

      it('should scroll to top when an input is focused', function() {
        $window.scrollTo = sinon.spy();

        focusFirstInputElement();

        expect($window.scrollTo).to.have.been.calledWith(0, 0);
      });

      it('should maximize the box when an input is touched', function() {
        minimizeFirstBox();
        expect(overlays().first().hasClass('maximized')).to.equal(false);

        touchFirstInputElement();

        expect(overlays().first().hasClass('maximized')).to.equal(true);
      });

      it('should do nothing when an input is touched but the box is already maximized', function() {
        maximizeFirstBox();
        $scope.$toggleMaximized = sinon.spy();

        touchFirstInputElement();

        expect($scope.$toggleMaximized).to.have.not.been.called;
      });

    });

  });

  describe('The boxOverlayContainer directive', function() {

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    }));

    it('should set the "maximized" CSS class when one box is maximized', function() {
      compileAndClickTheButton('<button box-overlay />');
      maximizeFirstBox();

      expect(angular.element('.box-overlay-container').hasClass('maximized')).to.equal(true);
    });

  });

  describe('The boxOverlayOpener service', function() {

    var boxOverlay, boxOverlayReturnValue, boxOverlayOpener;

    beforeEach(angular.mock.module(function($provide) {
      boxOverlay = function(options) {
        boxOverlay.receivedOptions = options;
        return boxOverlayReturnValue;
      };
      $provide.value('$boxOverlay', boxOverlay);
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_, _boxOverlayOpener_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      boxOverlayOpener = _boxOverlayOpener_;
    }));

    it('delegate to $boxOverlay with the given options', function() {
      boxOverlayOpener.open({my: 'super options'});

      expect(boxOverlay.receivedOptions).to.deep.equal({my: 'super options'});
    });

    it('call the show fn if the returned value is defined', function(done) {
      boxOverlayReturnValue = {
        show: done
      };

      boxOverlayOpener.open({});
    });

    it('not try to call the show fn if the returned value is undefined', function() {
      boxOverlayReturnValue = undefined;

      boxOverlayOpener.open({});
    });

  });

});
