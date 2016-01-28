'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('directive : action-list', function() {
  var element, $scope, $compile, $rootScope, screenSize, $modal, $popover;

  beforeEach(function() {
    screenSize = {
      on: function() {},
      get: function() {}
    };
    this.opened = {
      destroy: function() {}
    };
    var self = this;
    $modal = sinon.spy(function() {
      return self.opened;
    });
    $popover = sinon.spy(function() {
      return self.opened;
    });
  });

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.actionList');

    angular.mock.module(function($provide) {
      $provide.value('screenSize', screenSize);
      $provide.value('$modal', $modal);
      $provide.value('$popover', $popover);
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();

    this.initDirective = function(html) {
      element = $compile(html)($scope);
      $scope.$digest();
      return element;
    };
  }));

  it('should open a $modal when screen size is <= sm', function() {
    screenSize.is = function(match) {
      expect(match).to.equal('xs, sm');
      return true;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($modal).to.have.been.called;
  });

  it('should open a $popover when screen size is > sm', function() {
    screenSize.is = function() {
      return false;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($popover).to.have.been.called;
  });

  it('should first open a $modal when screen size is xs, then open a $popover when it changes to lg', function() {
    screenSize.is = sinon.stub();
    screenSize.is.onCall(0).returns(true);
    screenSize.is.onCall(1).returns(false);
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($modal).to.have.been.called;

    this.opened =  {
      $isShown: function() { return false; }
    };
    onResize(false);
    element.click();
    expect($popover).to.have.been.called;
  });

  it('should first open a $popover when screen size is lg, then open a $modal when it changes to xs', function() {
    screenSize.is = sinon.stub();
    screenSize.is.onCall(0).returns(false);
    screenSize.is.onCall(1).returns(true);
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($popover).to.have.been.called;

    this.opened =  {
      $isShown: function() { return true; }
    };
    onResize(true);
    element.click();
    expect($modal).to.have.been.called;
  });

  it('should not reopen $modal when the screen is resized twice, when screen size still <= xs', function() {
    screenSize.is = sinon.stub();
    screenSize.is.onCall(0).returns(false);
    screenSize.is.onCall(1).returns(false);
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    this.opened =  {
      $isShown: function() { return true; }
    };
    onResize(false);
    expect($popover).to.have.been.callCount(1);
    expect($modal).to.have.not.been.called;
  });

  it('should not reopen $popover when the screen is resized twice, when screen size still > xs', function() {
    screenSize.is = sinon.stub();
    screenSize.is.onCall(0).returns(true);
    screenSize.is.onCall(1).returns(true);
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    this.opened =  {
      $isShown: function() { return true; }
    };
    onResize(true);
    expect($modal).to.have.been.callCount(1);
    expect($popover).to.have.not.been.called;
  });

  it('should not open multiple $modal', function() {
    screenSize.is = function() {
      return true;
    };
    var destroySpy = sinon.spy();
    this.initDirective('<button action-list>Click Me</button>');
    this.opened =  {
      destroy: destroySpy
    };
    element.click();
    element.click();
    element.click();
    element.click();

    expect(destroySpy).to.have.been.callCount(3);
  });

  it('should not open multiple $popover', function() {
    screenSize.is = function() {
      return false;
    };
    var destroySpy = sinon.spy();
    this.initDirective('<button action-list>Click Me</button>');
    this.opened =  {
      destroy: destroySpy
    };
    element.click();
    element.click();
    element.click();
    element.click();

    expect(destroySpy).to.have.been.callCount(3);
  });

  it('should call $modal with template url', function() {
    screenSize.is = function() {
      return true;
    };
    this.initDirective('<button action-list action-list-url="expected-url.html">Click Me</button>');
    element.click();

    expect($modal).to.have.been.calledWith(sinon.match({
      template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'expected-url.html\'"></div></div>'
    }));
  });

  it('should call $popover with template url', function() {
    screenSize.is = function() {
      return false;
    };
    this.initDirective('<button action-list action-list-url="expected-url.html">Click Me</button>');
    element.click();

    expect($popover).to.have.been.calledWith(sinon.match.any, sinon.match({
      template: '<div class="action-list-container popover"><div class="popover-content" ng-include="\'expected-url.html\'"></div></div>'
    }));
  });

  it('should call destroy on $modal or $popover after a screen resize', function() {
    screenSize.is = sinon.stub();
    screenSize.is.onCall(0).returns(false);
    screenSize.is.onCall(1).returns(true);
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };

    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($popover).to.have.been.called;

    this.opened.destroy = sinon.spy();

    onResize(true);
    element.click();
    expect($modal).to.have.been.called;
    expect(this.opened.destroy).to.have.been.called;
  });
});
