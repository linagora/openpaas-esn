'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe.only('The ESNAttachmentController', function() {
  var $controller, $scope, $rootScope, esnAttachmentViewerService, esnAttachmentPreviewRegistryService;

  beforeEach(function() {
    esnAttachmentViewerService = {
      onBuild: sinon.spy(),
      onBuildRegistry: sinon.spy(),
      onOpen: sinon.spy(),
      onDestroy: sinon.spy()
    };

    esnAttachmentPreviewRegistryService = {
      getProvider: sinon.stub()
    };

    angular.mock.module('esn.attachment', function($provide) {
      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
      $provide.value('esnAttachmentPreviewRegistryService', esnAttachmentPreviewRegistryService);
    });
  });

  beforeEach(inject(function(_$controller_, _$rootScope_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
  }));

  function initController() {
    $scope = $rootScope.$new();

    var file = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000
    };
    var gallery = 'image';

    var controller = $controller('ESNAttachmentController',
      { $scope: $scope },
      { file: file },
      { gallery: gallery }
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {
    it('should add the attachment file into a gallery', function() {
      var controller = initController();

      controller.$onInit();

      expect(esnAttachmentViewerService.onInit).to.be.calledWith(controller.file, controller.gallery);
    });
  });

  describe('the openViewer function', function() {
    it('should open the attachment file in the corresponding gallery', function() {
      var controller = initController();

      controller.openViewer();

      expect(esnAttachmentViewerService.onOpen).to.be.calledWith(controller.file, controller.gallery);
    });
  });

  describe('the $onDestroy function', function() {
    it('should delete the attachment file in the corresponding gallery', function() {
      var controller = initController();

      controller.$onDestroy();

      expect(esnAttachmentViewerService.onDestroy).to.be.calledWith(controller.file, controller.gallery);
    });
  });

  describe('the renderContent function', function() {
    it('should add the attachment file into a gallery', function() {
      var controller = initController();

      controller.$onInit();

      expect(esnAttachmentViewerService.onInit).to.be.calledWith(controller.file, controller.gallery);
    });
  });
});
