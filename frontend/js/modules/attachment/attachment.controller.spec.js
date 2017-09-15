'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ESNAttachmentController', function() {
  var $componentController;
  var esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService;
  var element, file, previewer, controller;

  beforeEach(function() {
    esnAttachmentViewerService = {
      open: sinon.spy()
    };
    esnAttachmentViewerGalleryService = {
      addFileToGallery: sinon.spy(),
      removeFileFromGallery: sinon.spy()
    };
    esnAttachmentRegistryService = {
      addViewer: sinon.spy(),
      addPreviewer: sinon.spy(),
      getPreviewer: sinon.stub(),
      getDefaultPreviewer: sinon.stub()
    };

    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
      $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
      $provide.value('esnAttachmentRegistryService', esnAttachmentRegistryService);
    });
  });

  beforeEach(function() {
    inject(function(_$componentController_) {
      $componentController = _$componentController_;
    });
  });

  function initController(file, _previewer) {
    element = angular.element('<esn-attachment></esn-attachment>');

    var defaultPreviewer = {
      name: 'defaultPreivew',
      directive: 'esn-attachment-default-preview'
    };
    var bindings = {
      attachment: file,
      gallery: '123'
    };
    var locals = {
      $element: element
    };
    var controller = $componentController('esnAttachment', locals, bindings);

    esnAttachmentRegistryService.getPreviewer.returns(_previewer);
    esnAttachmentRegistryService.getDefaultPreviewer.returns(defaultPreviewer);

    return controller;
  }

  describe('the $onInit function', function() {
    it('should add the attachment file into a gallery', function() {
      file = {
        _id: 'id',
        name: 'image',
        contentType: 'image/jpeg',
        length: 1
      };
      previewer = {
        name: 'imagePreview',
        directive: 'esn-attachment-image-preview',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      controller = initController(file, previewer);
      controller.$onInit();

      expect(esnAttachmentViewerGalleryService.addFileToGallery).to.be.calledWith(controller._attachment, controller.gallery);
    });

    it('should render the image preview', function() {
      controller = initController(file, previewer);
      controller.$onInit();

      expect(angular.element(element.find('esn-attachment-image-preview')).length).to.be.equal(1);
    });

    it('should render the default preview', function() {
      file = {
        _id: 'id',
        name: 'video',
        contentType: 'video/mp4',
        length: 1
      };
      controller = initController(file, false);
      controller.$onInit();

      expect(angular.element(element.find('esn-attachment-default-preview')).length).to.be.equal(1);
    });
  });

  describe('the openClick function', function() {
    it('should open the viewer', function() {
      controller = initController(file, previewer);
      controller.onClick();

      expect(esnAttachmentViewerService.open).to.be.calledWith(controller._attachment, controller.gallery);
    });
  });

  describe('the $onDestroy function', function() {
    it('should delete the attachment file in the corresponding gallery', function() {
      controller = initController(file, previewer);
      controller.$onDestroy();

      expect(esnAttachmentViewerGalleryService.removeFileFromGallery).to.be.calledWith(controller._attachment, controller.gallery);
    });
  });
});
