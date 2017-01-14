'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The fullscreen-edit-form Angular module', function() {

  var $compile, $rootScope, $scope, $timeout, element, elementScrollService = {};

  beforeEach(module('jadeTemplates'));

  beforeEach(function() {
    angular.mock.module('esn.fullscreen-edit-form');
  });

  beforeEach(angular.mock.module(function($provide) {
    $provide.value('elementScrollService', elementScrollService);
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;

    $scope = $rootScope.$new();
  }));

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compile(html) {
    element = $compile(html)($scope);
    $scope.$digest();
    element.appendTo(document.body);

    return element;
  }

  describe('The autoScrollDownNgtagsinput directive', function() {
    var autoScrollDownSpy;

    beforeEach(function() {
      autoScrollDownSpy = sinon.spy();
      elementScrollService.autoScrollDown = autoScrollDownSpy;
    });

    it('should call the autoScrollDown method in a $timeout', function() {
      compile('<div auto-scroll-down-ngtagsinput></div>');
      $timeout.flush();

      expect(autoScrollDownSpy).to.be.called;
    });

  });

  describe('The autoFocusNgtagsinput directive', function() {

    it('should focus the input inside ngTagsInput in a $timeout', function() {
      compile('<div auto-focus-ngtagsinput><div class="tags"><input class="input" /></div></div>');
      $timeout.flush();

      expect(element.find('.input').get(0)).to.equal(document.activeElement);
    });

  });

  describe('The fullscreenEdit directive', function() {

    it('should append an overlay div to the .tag-list element', function() {
      expect(
        compile('<div fullscreen-edit><div class="tag-list"></div></div>')
          .find('.tag-list')
          .find('.overlay')
          .length
      ).to.equal(1);
    });

    it('should define $scope.dynamicPlaceholder to the "empty" placeholder when there is no tags', function() {
      compile('<div fullscreen-edit empty-placeholder="Empty"></div>');
      $timeout.flush();

      expect($scope.dynamicPlaceholder).to.equal('Empty');
    });

    it('should define $scope.dynamicPlaceholder to the "non-empty" placeholder when there is one tag', function() {
      compile(
        '<div fullscreen-edit non-empty-placeholder="NonEmpty">' +
        ' <div class="tag-list">' +
        '   <div class="tag-item">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $timeout.flush();

      expect($scope.dynamicPlaceholder).to.equal('NonEmpty');
    });

    it('should define $scope.dynamicPlaceholder to the "non-empty" placeholder when there are multiple tags and the last one starts before the danger zone', function() {
      compile(
        '<div fullscreen-edit non-empty-placeholder="NonEmpty">' +
        ' <div class="tag-list" style="position: absolute; width: 100px;">' +
        '   <div class="tag-item" style="position: absolute; left: 0;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 20px;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 40px;">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $timeout.flush();

      expect($scope.dynamicPlaceholder).to.equal('NonEmpty');
    });

    it('should define $scope.dynamicPlaceholder to "+1" when there are multiple tags and the last one starts after the danger zone', function() {
      compile(
        '<div fullscreen-edit>' +
        ' <div class="tag-list" style="position: absolute; width: 100px;">' +
        '   <div class="tag-item" style="position: absolute; left: 0;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 20px;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 110px;">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $timeout.flush();

      expect($scope.dynamicPlaceholder).to.equal('+1');
    });

    it('should define $scope.dynamicPlaceholder to "+2" when there are multiple tags and the last two starts after the danger zone', function() {
      compile(
        '<div fullscreen-edit>' +
        ' <div class="tag-list" style="position: absolute; width: 100px;">' +
        '   <div class="tag-item" style="position: absolute; left: 0;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 96px;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 200px;">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $timeout.flush();

      expect($scope.dynamicPlaceholder).to.equal('+2');
    });

    it('should hide tags that are counted in the "+" placeholder', function() {
      compile(
        '<div fullscreen-edit>' +
        ' <div class="tag-list" style="position: absolute; width: 100px;">' +
        '   <div class="tag-item tag1" style="position: absolute; left: 0;">' +
        '   </div>' +
        '   <div class="tag-item tag2" style="position: absolute; left: 80px;">' +
        '   </div>' +
        '   <div class="tag-item tag3" style="position: absolute; left: 200px;">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $timeout.flush();

      expect(element.find('.tag1').hasClass('hide')).to.equal(false);
      expect(element.find('.tag2').hasClass('hide')).to.equal(false);
      expect(element.find('.tag3').hasClass('hide')).to.equal(true);
    });

  });

});
