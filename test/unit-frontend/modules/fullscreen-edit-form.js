'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The fullscreen-edit-form Angular module', function() {

  var $compile, $rootScope, $scope, $httpBackend, element;

  beforeEach(module('jadeTemplates'));

  beforeEach(function() {
    angular.mock.module('esn.fullscreen-edit-form');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;

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

  describe('The fullscreenEditFormContainer directive', function() {

    it('should expose the compiled element as controller.container', function() {
      expect(
        compile('<div id="id" fullscreen-edit-form-container></div>')
          .controller('fullscreenEditFormContainer')
          .container[0]
          .id
      ).to.equal('id');
    });

  });

  describe('The fullscreenEdit directive', function() {

    it('should append an overlay div to the .tag-list element', function() {
      expect(
        compile('<div fullscreen-edit-form-container fullscreen-edit><div class="tag-list"></div></div>')
          .find('.tag-list')
          .find('.overlay')
          .length
      ).to.equal(1);
    });

    it('should expose the fullscreen-edit attribute value as $scope.templateUrl', function() {
      $httpBackend.expectGET('template.html').respond(200);

      compile('<div fullscreen-edit-form-container fullscreen-edit="template.html"></div>');
      $httpBackend.flush();

      expect($scope.templateUrl).to.equal('template.html');
    });

    it('should append a fullscreen form to the container element', function() {
      expect(
        compile('<div fullscreen-edit-form-container fullscreen-edit></div>')
          .find('.fullscreen-edit-form')
          .length
      ).to.equal(1);
    });

    it('should focus the input in the fullscreen form when an input is focused', function() {
      $httpBackend.expectGET('template.html').respond('<input id="input-in-fullscreen-form"/>');

      compile('<div fullscreen-edit-form-container fullscreen-edit="template.html"><input id="default-input"/></div>');
      $httpBackend.flush();

      element.find('input').focus();
      $scope.$digest();

      expect(document.activeElement.id).to.equal('input-in-fullscreen-form');
    });

    it('should add class "focused" to the fullscreen form when an input is focused', function() {
      compile('<div fullscreen-edit-form-container fullscreen-edit><input id="default-input"/></div>');

      element.find('input').focus();
      $scope.$digest();

      expect(element.find('.fullscreen-edit-form').parent().hasClass('focused')).to.equal(true);
    });

    it('should remove class "focused" from the fullscreen form when the form is closed', function() {
      compile('<div fullscreen-edit-form-container fullscreen-edit></div>');

      element.find('input').focus();
      $scope.$digest();
      $scope.close();

      expect(element.find('.fullscreen-edit-form').parent().hasClass('focused')).to.equal(false);
    });

    it('should define $scope.dynamicPlaceholder to the "empty" placeholder when there is no tags', function() {
      compile('<div fullscreen-edit-form-container fullscreen-edit empty-placeholder="Empty"></div>');

      expect($scope.dynamicPlaceholder).to.equal('Empty');
    });

    it('should define $scope.dynamicPlaceholder to the "non-empty" placeholder on close when there is one tag', function() {
      compile(
        '<div fullscreen-edit-form-container fullscreen-edit non-empty-placeholder="NonEmpty">' +
        ' <div class="tag-list">' +
        '   <div class="tag-item">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $scope.close();

      expect($scope.dynamicPlaceholder).to.equal('NonEmpty');
    });

    it('should define $scope.dynamicPlaceholder to the "non-empty" placeholder on close when there are multiple tags and the last one starts before the danger zone', function() {
      compile(
        '<div fullscreen-edit-form-container fullscreen-edit non-empty-placeholder="NonEmpty">' +
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
      $scope.close();

      expect($scope.dynamicPlaceholder).to.equal('NonEmpty');
    });

    it('should define $scope.dynamicPlaceholder to "+1" on close when there are multiple tags and the last one starts after the danger zone', function() {
      compile(
        '<div fullscreen-edit-form-container fullscreen-edit>' +
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
      $scope.close();

      expect($scope.dynamicPlaceholder).to.equal('+1');
    });

    it('should define $scope.dynamicPlaceholder to "+2" on close when there are multiple tags and the last two starts after the danger zone', function() {
      compile(
        '<div fullscreen-edit-form-container fullscreen-edit>' +
        ' <div class="tag-list" style="position: absolute; width: 100px;">' +
        '   <div class="tag-item" style="position: absolute; left: 0;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 80px;">' +
        '   </div>' +
        '   <div class="tag-item" style="position: absolute; left: 200px;">' +
        '   </div>' +
        ' </div>' +
        '</div>'
      );
      $scope.close();

      expect($scope.dynamicPlaceholder).to.equal('+2');
    });

    it('should hide tags that are counted in the "+" placeholder', function() {
      compile(
        '<div fullscreen-edit-form-container fullscreen-edit>' +
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
      $scope.close();

      expect(element.find('.tag1').hasClass('hide')).to.equal(false);
      expect(element.find('.tag2').hasClass('hide')).to.equal(true);
      expect(element.find('.tag3').hasClass('hide')).to.equal(true);
    });

  });

});
