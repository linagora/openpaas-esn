'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The dropdown-list directive', function() {
  var $scope, $compile, $dropdown, element;

  beforeEach(function() {
    var self = this;

    this.opened = {
      hide: sinon.spy(function() {
        self.opened.$isShown = false;
      })
    };

    $dropdown = sinon.spy(function() {
      self.opened.$isShown = true;
      return self.opened;
    });
  });

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.dropdownList');

    angular.mock.module(function($provide) {
      $provide.value('$dropdown', $dropdown);
    });
  });

  beforeEach(
    angular.mock.inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();

      this.initDirective = function(html) {
        element = $compile(html)($scope);
        $scope.$digest();

        return element;
      };
    })
  );

  it('should open a $dropdown', function() {
    this.initDirective('<button dropdown-list/>');
    element.click();

    expect($dropdown).to.have.been.called;
  });

  it('should hide the $dropdown when it is already shown', function() {
    this.initDirective('<button dropdown-list/>');

    element.click();
    element.click();

    expect(this.opened.hide).to.have.been.callCount(1);
  });

  it('should open the $dropdown when it is already hidden', function() {
    this.initDirective('<button dropdown-list/>');

    element.click();
    element.click();
    element.click();

    expect($dropdown).to.have.been.callCount(2);
    expect(this.opened.hide).to.have.been.callCount(1);
  });

  it('should call $dropdown with template url', function() {
    this.initDirective('<button dropdown-list="expected-url.html"/>');
    element.click();

    expect($dropdown).to.have.been.calledWith(sinon.match.any, sinon.match({
      template: '<ul class="dropdown-menu" role="menu"><li><div ng-include="\'expected-url.html\'"></div></li></ul>'
    }));
  });

  it('should hide the $dropdown on $destroy', function() {
    this.initDirective('<button dropdown-list/>');

    element.click();
    $scope.$destroy();

    expect(this.opened.hide).to.have.been.calledOnce;
  });

});
