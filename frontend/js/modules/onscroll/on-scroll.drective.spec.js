'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The onScroll directive', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('esn.onscroll');
    inject(function(_$rootScope_, _$compile_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    });
  });

  function compileComponent(html, scope) {
    var $scope = scope || $rootScope.$new();
    var element = $compile(html)($scope);

    $scope.$digest();

    return element;
  }

  it('should apply onScrollDown attr when wheel is scroll down ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();

    var element = compileComponent('<div on-scroll on-scroll-down="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = -1;
    element.triggerHandler(event);

    expect(scope.testScroll).to.have.been.called;
  });

  it('should apply onScrollUp attr when wheel is scroll up ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();

    var element = compileComponent('<div on-scroll on-scroll-up="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = 1;
    element.triggerHandler(event);

    expect(scope.testScroll).to.have.been.called;
  });

  it('should not apply onScrollDown attr when wheel is scroll up ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();

    var element = compileComponent('<div on-scroll on-scroll-down="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = 1;
    element.triggerHandler(event);

    expect(scope.testScroll).to.have.not.been.called;
  });

  it('should not apply onScrollUp attr when wheel is scroll down ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();

    var element = compileComponent('<div on-scroll on-scroll-up="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = -1;
    element.triggerHandler(event);

    expect(scope.testScroll).to.have.not.been.called;
  });

  it('should preventDefault when scope.prevented is true ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();
    scope.prevented = true;

    var element = compileComponent('<div on-scroll on-scroll-up="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = -1;
    event.preventDefault = sinon.spy();
    element.triggerHandler(event);

    expect(event.preventDefault).to.have.been.called;
  });

  it('should not preventDefault when scope.prevented is false ', function() {
    var scope = $rootScope.$new();

    scope.testScroll = sinon.spy();
    scope.prevented = false;

    var element = compileComponent('<div on-scroll on-scroll-up="testScroll()" />', scope);
    var event = new Event('onmousewheel');

    event.wheelDelta = -1;
    event.preventDefault = sinon.spy();
    element.triggerHandler(event);

    expect(event.preventDefault).to.have.not.been.called;
  });
});

