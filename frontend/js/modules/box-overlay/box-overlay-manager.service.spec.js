'use strict';

/* global chai: false*/

var expect = chai.expect;

describe('The boxOverlayManager service', function() {
  var $rootScope, $scope;
  var boxOverlayManager;

  beforeEach(module('jadeTemplates'));
  beforeEach(module('esn.box-overlay', function($provide) {
    $provide.value('notificationFactory', {});
  }));

  beforeEach(function() {
    inject(function(_$rootScope_, _boxOverlayManager_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      boxOverlayManager = _boxOverlayManager_;
    });
  });

  describe('The removeContainerIfPossible function', function() {
    it('should remove container if there is no opened composer', function() {
      boxOverlayManager
        .createElement($scope)
        .then(function() {
          angular.element('.box-overlay-open').remove();
          boxOverlayManager.removeContainerIfPossible();

          var container = angular.element('.box-overlay-container')[0];

          expect(container).to.not.exist;
        });

      $rootScope.$digest();
    });
  });

});
