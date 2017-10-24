'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('directive : action-list', function() {
  var element, controller;
  var $scope, $compile, $rootScope, matchmedia, $modal, $popover, onResize, ESN_MEDIA_QUERY_SM_XS;

  beforeEach(function() {
    matchmedia = {
      on: function(query, callback) {
        onResize = callback;
      },
      is: angular.noop
    };
    this.opened = {
      destroy: sinon.spy(),
      hide: sinon.spy()
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
      $provide.value('matchmedia', matchmedia);
      $provide.value('$modal', $modal);
      $provide.value('$popover', $popover);
    });
  });

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _ESN_MEDIA_QUERY_SM_XS_) {
    ESN_MEDIA_QUERY_SM_XS = _ESN_MEDIA_QUERY_SM_XS_;
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();

    this.initDirective = function(html) {
      element = $compile(html)($scope);
      $scope.$digest();
      controller = element.controller('actionList');

      return element;
    };
  }));

  it('should not propagate the click to the parent elements', function() {
    matchmedia.is = function(match) {
      expect(match).to.equal(ESN_MEDIA_QUERY_SM_XS);

      return true;
    };

    this.initDirective('<div ng-click="parentClicked = true"><button action-list>Click Me</button></div>');
    element.find('button').click();

    expect($scope.parentClicked).to.equal(undefined);
  });

  it('should not run the default handlers of parent links', function(done) {
    matchmedia.is = function(match) {
      expect(match).to.equal(ESN_MEDIA_QUERY_SM_XS);

      return true;
    };

    var event = {
      type: 'click',
      stopImmediatePropagation: angular.noop,
      preventDefault: done
    };

    this.initDirective('<a href="/should/not/go/there"><button action-list>Click Me</button></a>');

    element.find('button').triggerHandler(event);
  });

  it('should open a $modal when screen size is <= sm', function() {
    matchmedia.is = function(query) {
      expect(query).to.equal(ESN_MEDIA_QUERY_SM_XS);

      return true;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($modal).to.have.been.called;
  });

  it('should open a $popover when screen size is > sm', function() {
    matchmedia.is = function() {
      return false;
    };
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    expect($popover).to.have.been.called;
  });

  it('should first open a $modal when screen size is xs, then open a $popover when it changes to lg', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(true);
    matchmedia.is.onCall(1).returns(false);
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($modal).to.have.been.called;

    this.opened.$isShown = function() { return false; };

    onResize({matches: false});
    element.click();
    expect($popover).to.have.been.called;
  });

  it('should not resize a modal/popover of other directive', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(true);
    matchmedia.is.onCall(1).returns(false);
    this.initDirective('<button action-list>Click Me</button>');

    element.click();

    expect($modal).to.have.been.called;
    this.opened.scope = {};
    onResize({matches: false});
    expect($popover).to.not.have.been.called;
  });

  it('should first open a $popover when screen size is lg, then open a $modal when it changes to xs', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(false);
    matchmedia.is.onCall(1).returns(true);
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($popover).to.have.been.called;

    onResize({matches: true});
    element.click();
    expect($modal).to.have.been.called;
  });

  it('should not reopen $modal when the screen is resized twice, when screen size still <= xs', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(false);
    matchmedia.is.onCall(1).returns(false);
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    onResize({matches: false});
    expect($popover).to.have.been.callCount(1);
    expect($modal).to.have.not.been.called;
  });

  it('should not reopen $popover when the screen is resized twice, when screen size still > xs', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(true);
    matchmedia.is.onCall(1).returns(true);
    this.initDirective('<button action-list>Click Me</button>');
    element.click();

    onResize({matches: true});
    expect($modal).to.have.been.callCount(1);
    expect($popover).to.have.not.been.called;
  });

  it('should hide the dialog when it is already shown', function() {
    matchmedia.is = function() {
      return true;
    };
    this.initDirective('<button action-list>Click Me</button>');

    element.click();
    element.click();

    expect(this.opened.hide).to.have.been.callCount(1);
  });

  it('should not open multiple $modal', function() {
    matchmedia.is = function() {
      return true;
    };
    this.initDirective('<button action-list>Click Me</button>');

    element.click();
    element.click();
    element.click();
    element.click();

    expect(this.opened.hide).to.have.been.callCount(3);
  });

  it('should not open multiple $popover', function() {
    matchmedia.is = function() {
      return false;
    };
    this.initDirective('<button action-list>Click Me</button>');

    element.click();
    element.click();
    element.click();
    element.click();

    expect(this.opened.hide).to.have.been.callCount(3);
  });

  it('should call $modal with template url', function() {
    matchmedia.is = function() {
      return true;
    };
    this.initDirective('<button action-list="expected-url.html">Click Me</button>');
    element.click();

    expect($modal).to.have.been.calledWith(sinon.match({
      template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'expected-url.html\'"></div></div>'
    }));
  });

  it('should call $popover with template url', function() {
    matchmedia.is = function() {
      return false;
    };
    this.initDirective('<button action-list="expected-url.html">Click Me</button>');
    element.click();

    expect($popover).to.have.been.calledWith(sinon.match.any, sinon.match({
      template: '<div class="action-list-container popover"><div class="popover-content" ng-include="\'expected-url.html\'"></div></div>'
    }));
  });

  it('should call hide on $modal or $popover after a screen resize', function() {
    matchmedia.is = sinon.stub();
    matchmedia.is.onCall(0).returns(false);
    matchmedia.is.onCall(1).returns(true);
    var onResize;

    matchmedia.on = function(query, callback) {
      onResize = callback;
    };

    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    expect($popover).to.have.been.called;

    onResize({matches: true});
    element.click();
    expect($modal).to.have.been.called;
    expect(this.opened.hide).to.have.been.called;
  });

  it('should not destroy a dialog if it is shown', function() {
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    this.opened.$isShown = true;

    controller.destroy();

    expect(this.opened.destroy).to.not.have.been.called;
  });

  it('should destroy a non-shown along with the dialogLock', function() {
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    this.opened.$isShown = false;

    controller.destroy();

    expect(this.opened.destroy).to.have.been.calledTwice;
  });

  it('should hide the dialog on $destroy', function() {
    this.initDirective('<button action-list>Click Me</button>');
    var hideFnSpy = sinon.spy(controller, 'hide');

    element.click();
    $scope.$destroy();

    expect(hideFnSpy).to.have.been.calledOnce;
  });

  it('should destroy the dialog on action-list.hide', function() {
    this.initDirective('<button action-list>Click Me</button>');
    element.click();
    $scope.$broadcast('action-list.hide');

    expect(this.opened.destroy).to.have.been.called;
  });

  it('should not destroy the dialog belong to other element on action-list.hide', function() {
    var scope1;

    scope1 = $scope = $rootScope.$new();
    this.initDirective('<button action-list>1</button>');

    $scope = $rootScope.$new();

    var element2 = this.initDirective('<button action-list>2</button>');

    element2.click();
    scope1.$broadcast('action-list.hide');

    expect(this.opened.destroy).to.have.been.callCount(0);
  });

  it('should not open dialog onclick when actionListNoClick attribute is provided', function() {
    this.initDirective('<button action-list action-list-no-click></button>');
    var openFnSpy = sinon.spy(controller, 'open');

    element.click();

    expect(openFnSpy).to.have.been.callCount(0);
  });

  it('should open dialog on click when actionListNoClick attribute is not provide', function() {
    this.initDirective('<button action-list></button>');
    var openFnSpy = sinon.spy(controller, 'open');

    element.click();

    expect(openFnSpy).to.have.been.calledOnce;
  });

});
