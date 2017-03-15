'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn-textarea-autosize directive', function() {
  var $scope, $compile, element, autosize;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.textarea-autosize');
  });

  beforeEach(
    angular.mock.inject(function(_$compile_, _$rootScope_, _autosize_) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      autosize = _autosize_;

      this.initDirective = function(html) {
        element = $compile(html)($scope);
        $scope.$digest();

        return element;
      };
    })
  );

  it('should set max height of textarea', function() {
    $scope.textAreaContent = 'text';
    this.initDirective('<textarea esn-textarea-autosize textarea-max-rows="3" rows="1" ng-model="textAreaContent" style="line-height: 10px;"/>');

    expect(element.css('max-height')).to.equal('30px');
  });

  it('should call autosize update method when textarea is emptied', function() {
    autosize.update = sinon.spy();
    $scope.textAreaContent = 'text';
    this.initDirective('<textarea esn-textarea-autosize textarea-max-rows="3" rows="1" ng-model="textAreaContent" style="line-height: 10px;"/>');

    $scope.textAreaContent = '';
    $scope.$digest();

    expect(autosize.update).has.been.calledOnce;
  });
});
