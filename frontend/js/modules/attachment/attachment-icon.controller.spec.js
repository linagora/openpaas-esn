'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ESNAttachmentIconController', function() {
  var $controller, $scope, $rootScope, ESN_ATTACHMENT_ICONS;

  function initController(type) {
    var controller = $controller('ESNAttachmentIconController',
      {$scope: $scope},
      {type: type}
    );

    $scope.$digest();

    return controller;
  }

  beforeEach(function() {
    angular.mock.module('esn.attachment');
  });

  beforeEach(inject(function(_$controller_, _$q_, _$rootScope_, _ESN_ATTACHMENT_ICONS_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    ESN_ATTACHMENT_ICONS = _ESN_ATTACHMENT_ICONS_;
    $scope = $rootScope.$new();
  }));

  describe('the $onInit function', function() {
    it('should set iconClass to ESN_ATTACHMENT_ICONS.application for application contentType', function() {
      var controller = initController('application/pdf');

      controller.$onInit();

      expect(controller.iconClass).to.equal(ESN_ATTACHMENT_ICONS.application);
    });

    it('should set iconClass to ESN_ATTACHMENT_ICONS.image for image contentType', function() {
      var controller = initController('image/png');

      controller.$onInit();

      expect(controller.iconClass).to.equal(ESN_ATTACHMENT_ICONS.image);
    });

    it('should set iconClass to ESN_ATTACHMENT_ICONS.video for image contentType', function() {
      var controller = initController('video/mp4');

      controller.$onInit();

      expect(controller.iconClass).to.equal(ESN_ATTACHMENT_ICONS.video);
    });

    it('should set iconClass to ESN_ATTACHMENT_ICONS.default for unknown contentType', function() {
      var controller = initController('foo/bar');

      controller.$onInit();

      expect(controller.iconClass).to.equal(ESN_ATTACHMENT_ICONS.default);
    });
  });
});
