'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ESNAttachmentController', function() {
  var $controller, $scope, $rootScope, esnAttachmentViewerService;

  beforeEach(function() {
    esnAttachmentViewerService = {
      onInit: sinon.spy(),
      onBuildRegistry: sinon.spy(),
      onOpen: sinon.spy(),
      onDestroy: sinon.spy()
    };

    angular.mock.module('esn.attachment', function($provide) {
      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
    });
  });

  beforeEach(inject(function(_$controller_, _$rootScope_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
  }));

  function initController() {
    $scope = $rootScope.$new();

    var attachment = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000
    };
    var gallery = 'image';

    var controller = $controller('ESNAttachmentController',
      { $scope: $scope },
      { attachment: attachment },
      { gallery: gallery }
    );

    $scope.$digest();

    return controller;
  }

  describe('the $onInit function', function() {
    it('should add the attachment file into a gallery', function() {
      var controller = initController();

      controller.$onInit();

      expect(esnAttachmentViewerService.onInit).to.be.calledWith(controller.attachment, controller.gallery);
    });
  });

  describe('the openViewer function', function() {
    it('should open the attachment file in the corresponding gallery', function() {
      var controller = initController();

      controller.openViewer();

      expect(esnAttachmentViewerService.onOpen).to.be.calledWith(controller.attachment, controller.gallery);
    });
  });

  describe('the $onDestroy function', function() {
    it('should delete the attachment file in the corresponding gallery', function() {
      var controller = initController();

      controller.$onDestroy();

      expect(esnAttachmentViewerService.onDestroy).to.be.calledWith(controller.attachment, controller.gallery);
    });
  });
});
