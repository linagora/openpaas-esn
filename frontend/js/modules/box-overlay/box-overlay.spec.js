'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The box-overlay Angular module', function() {

  var $window, $compile, $rootScope, $scope, $timeout, $q, element, deviceDetector, notificationFactory, esnI18nService, DEVICES;

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
    angular.mock.module('esn.box-overlay', function($provide) {
      esnI18nService = {
        translate: function(input) {
          return {
            toString: function() { return input; }
          };
        }
      };

      $provide.value('notificationFactory', notificationFactory = {
        weakError: sinon.spy()
      });
      $provide.value('esnI18nService', esnI18nService);
    });
  });

  afterEach(function() {
    angular.element('.box-overlay-container').remove();
  });

  describe('boxOverlay directive', function() {

    var $httpBackend, ESN_BOX_OVERLAY_EVENTS, ESN_BOX_OVERLAY_MAX_WINDOWS;

    beforeEach(inject(function(_$window_, _$compile_, _$rootScope_, _$httpBackend_, _$timeout_,
        _deviceDetector_, _DEVICES_, _ESN_BOX_OVERLAY_EVENTS_, _ESN_BOX_OVERLAY_MAX_WINDOWS_) {
      $window = _$window_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
      $timeout = _$timeout_;
      deviceDetector = _deviceDetector_;
      DEVICES = _DEVICES_;
      ESN_BOX_OVERLAY_EVENTS = _ESN_BOX_OVERLAY_EVENTS_;
      ESN_BOX_OVERLAY_MAX_WINDOWS = _ESN_BOX_OVERLAY_MAX_WINDOWS_;

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

    it('should accept to open ESN_BOX_OVERLAY_MAX_WINDOWS boxes', function() {
      var notificationCount = 0;

      $rootScope.$on('box-overlay:no-space-left-on-screen', function() {
        notificationCount++;
      });

      var button = compileAndClickTheButton('<button box-overlay />');

      for (var i = 0; i < ESN_BOX_OVERLAY_MAX_WINDOWS; i++) {
        clickTheButton(button);
      }

      expect(overlays()).to.have.length(ESN_BOX_OVERLAY_MAX_WINDOWS);
      expect(notificationCount).to.equal(1);
    });

    it('should not accept to have more than ESN_BOX_OVERLAY_MAX_WINDOWS boxes', function() {
      var button = compileAndClickTheButton('<button box-overlay />');

      for (var i = 0; i < ESN_BOX_OVERLAY_MAX_WINDOWS * 2; i++) {
        clickTheButton(button);
      }

      expect(overlays()).to.have.length(ESN_BOX_OVERLAY_MAX_WINDOWS);
    });

    it('should notify when it cannot open more boxes', function() {
      var button = compileAndClickTheButton('<button box-overlay />');

      for (var i = 0; i < ESN_BOX_OVERLAY_MAX_WINDOWS + 1; i++) {
        clickTheButton(button);
      }

      expect(notificationFactory.weakError).to.have.been.calledWith('', 'Cannot open more than ' + ESN_BOX_OVERLAY_MAX_WINDOWS + ' windows. Please close one and try again');
    });

    it('should not accept to open two boxes with the same identifier', function() {
      var button = compileAndClickTheButton('<button box-overlay box-id="identifier" />');
      clickTheButton(button);

      expect(overlays()).to.have.length(1);
    });

    it('should accept to reopen a box when one has been closed', function() {
      var button = compileAndClickTheButton('<button box-overlay />');

      clickTheButton(button);
      $timeout.flush();
      expect(overlays()).to.have.length(2);

      closeFirstBox();
      expect(overlays()).to.have.length(1);

      clickTheButton(button);
      $timeout.flush();
      expect(overlays()).to.have.length(2);
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

    it('should open in the given initial state when defined', function() {
      compileAndClickTheButton('<button box-overlay box-initial-state="FULL_SCREEN" />');

      expect(angular.element('.full-screen')).to.have.length(1);
    });

    it('should not be closeable when closeable=false is given', function() {
      compileAndClickTheButton('<button box-overlay box-closeable="false" />');

      expect(angular.element('.box-overlay-open i.close')).to.have.length(0);
    });

    it('should be closeable when no closeable=true is given', function() {
      compileAndClickTheButton('<button box-overlay box-closeable="true" />');

      expect(angular.element('.box-overlay-open i.close')).to.have.length(1);
    });

    it('should be closeable when no closeable option is given', function() {
      compileAndClickTheButton('<button box-overlay />');

      expect(angular.element('.box-overlay-open i.close')).to.have.length(1);
    });

    it('should have minimize and maximize buttons when no allowedStates option is given', function() {
      compileAndClickTheButton('<button box-overlay />');

      expect(angular.element('.box-overlay-open .toggle-maximize')).to.have.length(1);
      expect(angular.element('.box-overlay-open .toggle-minimize')).to.have.length(1);
    });

    it('should have maximize button when allowedStates contains MAXIMIZED', function() {
      compileAndClickTheButton('<button box-overlay box-allowed-states="[\'MAXIMIZED\']"/>');

      expect(angular.element('.box-overlay-open .toggle-maximize')).to.have.length(1);
    });

    it('should not have minimize button when allowedStates does not contain MINIMIZED', function() {
      compileAndClickTheButton('<button box-overlay box-allowed-states="[\'MAXIMIZED\']"/>');

      expect(angular.element('.box-overlay-open .toggle-minimize')).to.have.length(0);
    });

    it('should have minimize button when allowedStates contains MINIMIZED', function() {
      compileAndClickTheButton('<button box-overlay box-allowed-states="[\'MINIMIZED\']"/>');

      expect(angular.element('.box-overlay-open .toggle-minimize')).to.have.length(1);
    });

    it('should not have maximize button when allowedStates does not contain MAXIMIZED', function() {
      compileAndClickTheButton('<button box-overlay box-allowed-states="[\'MINIMIZED\']"/>');

      expect(angular.element('.box-overlay-open .toggle-maximize')).to.have.length(0);
    });

    describe('min/maximize buttons should notify child components', function() {

      var mock, unsubscriber;

      beforeEach(function() {
        compileAndClickTheButton('<button box-overlay />');
        mock = sinon.spy();
        unsubscriber = $rootScope.$on(ESN_BOX_OVERLAY_EVENTS.RESIZED, mock);
      });

      afterEach(function() {
        unsubscriber && unsubscriber();
      });

      it('should raise event ESN_BOX_OVERLAY_EVENTS.RESIZED when unminimized', function() {
        minimizeFirstBox();
        maximizeFirstBox();

        expect(mock).to.have.been.calledOnce;
      });

      it('should raise event ESN_BOX_OVERLAY_EVENTS.RESIZED when maximized', function() {
        maximizeFirstBox();

        expect(mock).to.have.been.calledOnce;
      });

      it('should NOT raise event ESN_BOX_OVERLAY_EVENTS.RESIZED when minimized', function() {
        minimizeFirstBox();

        expect(mock).to.not.have.been.called;
      });

      it('should raise event ESN_BOX_OVERLAY_EVENTS.RESIZED when minimized clicked 2 times', function() {
        minimizeFirstBox();
        minimizeFirstBox();

        expect(mock).to.have.been.calledOnce;
      });
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

  describe('The boxOverlay service', function() {
    var $boxOverlay, $httpBackend;

    beforeEach(inject(function(_$timeout_, _$httpBackend_, _$boxOverlay_, _$q_) {
      $timeout = _$timeout_;
      $httpBackend = _$httpBackend_;
      $boxOverlay = _$boxOverlay_;
      $q = _$q_;
    }));

    beforeEach(function() {
      $httpBackend.expectGET('/path/to/template').respond('');
    });

    it('should update the title', function() {
      var overlay = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      overlay.updateTitle('New Title');

      expect(overlay.$scope.title).to.equal('New Title');
    });

    it('should allow hiding and opening through scope functions', function() {
      var overlay = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      overlay.$scope.$show();
      $timeout.flush();
      expect(overlay.$isShown).to.equal(true);

      overlay.$scope.$hide();
      $timeout.flush();
      expect(overlay.$isShown).to.equal(false);
    });

    it('should allow hiding and reopening the same overlay over and over again', function() {
      var overlay = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      for (var i = 0; i < 10; i++) {
        overlay.$scope.$show();
        $timeout.flush();
        expect(overlay.$isShown).to.equal(true);

        overlay.$scope.$hide();
        $timeout.flush();
        expect(overlay.$isShown).to.equal(false);
      }
    });

    it('should call $q.when when trying to close if no callback has been set', function(done) {
      sinon.spy($q, 'when');

      var target = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      target.$scope.$close().then(function() {
        expect($q.when).to.have.been.called;
        done();
      });

      target.$scope.$digest();
    });

    it('should call provided callback when trying to close', function(done) {
      var callback = sinon.stub().returns($q.when());
      var target = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      target.$scope.$onTryClose(callback);

      target.$scope.$close().then(function() {
        expect(callback).to.have.been.called;
        done();
      });

      target.$scope.$digest();
    });

    it('should hide the the box overlay when trying to close', function() {
      var target = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      sinon.spy(target, 'hide');

      target.$scope.$close();
      expect(target.hide).to.have.been.called;
    });

    it('should destroy overlay when callback resolves', function() {
      var target = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      sinon.spy(target, 'destroy');

      target.$scope.$onTryClose(function() {
        return $q.when();
      });

      target.$scope.$close();

      target.$scope.$digest();
      $timeout.flush();

      expect(target.destroy).to.have.been.called;
    });

    it('should not destroy overlay when callback rejects', function() {
      var target = $boxOverlay({
        id: 0,
        title: 'Default title',
        templateUrl: '/path/to/template'
      });

      sinon.spy(target, 'destroy');

      target.$scope.$onTryClose(function() {
        return $q.reject();
      });

      target.$scope.$digest();

      expect($timeout.flush).to.throw();
      expect(target.destroy).not.to.have.been.called;
    });
  });

  describe('The BoxOverlayStateManager factory', function() {
    var BoxOverlayStateManager, stateManager;

    beforeEach(inject(function(_BoxOverlayStateManager_) {
      BoxOverlayStateManager = _BoxOverlayStateManager_;
      stateManager = new BoxOverlayStateManager();
    }));

    it('should call registered functions when toggled', function() {
      var callback = sinon.spy();

      stateManager.registerHandler(callback);
      stateManager.toggle(BoxOverlayStateManager.STATES.NORMAL);

      expect(callback).to.have.been.calledOnce;
    });

    it('should register only functions', function() {
      var callback = 'foobar';

      stateManager.registerHandler(callback);

      expect(function() {stateManager.toggle(BoxOverlayStateManager.STATES.NORMAL);}).to.not.throw();
    });

    it('should have no registered callback by default', function() {
      stateManager = new BoxOverlayStateManager();

      expect(stateManager.callbacks).to.be.an('array').that.is.empty;
    });
  });

});
