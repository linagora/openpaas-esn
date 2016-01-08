'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('directive : action-list', function() {
  var element, $scope, $compile, $rootScope, screenSize, $modal, $dropdown;

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
    $dropdown = sinon.spy(function() {
      return self.opened;
    });
  });

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.actionList');

    angular.mock.module(function($provide) {
      $provide.value('screenSize', screenSize);
      $provide.value('$modal', $modal);
      $provide.value('$dropdown', $dropdown);
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

  it('should open a $modal when screen size is <= xs', function() {
    screenSize.get = function() {
      return 'xs';
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($modal).to.have.been.called;

  });

  it('should open a $dropdown when screen size is > xs', function() {
    screenSize.get = function() {
      return 'md';
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($dropdown).to.have.been.called;

  });

  it('should first open a $modal when screen size is xs, then open a $dropdown when it changes to lg', function() {
    screenSize.get = sinon.stub();
    screenSize.get.onCall(0).returns('xs');
    screenSize.get.onCall(1).returns('lg');
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
    expect($dropdown).to.have.been.called;

  });

  it('should first open a $dropdown when screen size is lg, then open a $modal when it changes to xs', function() {
    screenSize.get = sinon.stub();
    screenSize.get.onCall(0).returns('lg');
    screenSize.get.onCall(1).returns('xs');
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($dropdown).to.have.been.called;

    this.opened =  {
      $isShown: function() { return true; }
    };
    onResize(true);
    element.click();
    expect($modal).to.have.been.called;
  });

  it('should not reopen $modal when the screen is resized twice, when screen size still <= xs', function() {
    screenSize.get = sinon.stub();
    screenSize.get.onCall(0).returns('lg');
    screenSize.get.onCall(1).returns('md');
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
    expect($dropdown).to.have.been.callCount(1);
    expect($modal).to.have.not.been.called;

  });

  it('should not reopen $dropdown when the screen is resized twice, when screen size still > xs', function() {
    screenSize.get = sinon.stub();
    screenSize.get.onCall(0).returns('xs');
    screenSize.get.onCall(1).returns('xs');
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
    expect($dropdown).to.have.not.been.called;

  });

  it('should not open multiple $modal', function() {
    screenSize.get = function() {
      return 'xs';
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

  it('should not open multiple $dropdown', function() {
    screenSize.get = function() {
      return 'lg';
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

  it('should call mobile template url', function() {
    screenSize.get = function() {
      return 'xs';
    };
    this.initDirective('<button action-list template-mobile-url="action-list-mobile.html">Click Me</button>');
    element.click();

    expect($modal).to.have.been.calledWith(sinon.match({templateUrl: 'action-list-mobile.html'}));

  });

  it('should call desktop template url', function() {
    screenSize.get = function() {
      return 'md';
    };
    this.initDirective('<button action-list template-desktop-url="toto">Click Me</button>');
    element.click();

    expect($dropdown).to.have.been.calledWith(sinon.match.any, sinon.match({templateUrl: 'toto'}));

  });

  it('should call destroy on $modal or $dropdown after a screen resize', function() {
    screenSize.get = sinon.stub();
    screenSize.get.onCall(0).returns('lg');
    screenSize.get.onCall(1).returns('xs');
    var onResize;
    screenSize.on = function(event, callback) {
      onResize = callback;
    };

    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($dropdown).to.have.been.called;

    this.opened.destroy = sinon.spy();

    onResize(true);
    element.click();
    expect($modal).to.have.been.called;
    expect(this.opened.destroy).to.have.been.called;
  });
});
