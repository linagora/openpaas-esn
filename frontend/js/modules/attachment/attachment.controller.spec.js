'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ESNAttachmentController', function() {
  var $componentController, $rootScope, $compile;
  var esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService;
  var element, file, provider, controller;

  beforeEach(function() {
    esnAttachmentViewerService = {
      open: sinon.spy()
    };
    esnAttachmentViewerGalleryService = {
      addFileToGallery: sinon.spy(),
      removeFileFromGallery: sinon.spy()
    };
    esnAttachmentRegistryService = {
      addAttachmentProvider: sinon.spy(),
      getProvider: sinon.stub()
    };

    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
      $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
      $provide.value('esnAttachmentRegistryService', esnAttachmentRegistryService);
    });
  });

  beforeEach(function() {
    inject(function(_$componentController_, _$rootScope_, _$document_, _$compile_) {
      $componentController = _$componentController_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  function initController(file, provider) {
    element = $compile('<esn-attachment></esn-attachment>')($rootScope.$new());

    var bindings = {
      attachment: file,
      gallery: '123'
    };
    var locals = {
      $element: element
    };
    var controller = $componentController('esnAttachment', locals, bindings);
    var viewer = provider;

    esnAttachmentRegistryService.getProvider.returns(viewer);

    return controller;
  }

  describe('the $onInit function', function() {
    it('should add the attachment file into a gallery', function() {
      file = {
        _id: 'id',
        contentType: 'image/jpeg'
      };
      provider = {
        name: 'imagePreview',
        directive: 'esn-attachment-image-preview',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      controller = initController(file, provider);
      controller.$onInit();

      expect(esnAttachmentViewerGalleryService.addFileToGallery).to.be.calledWith(controller.attachment, controller.gallery);
    });

    it('should render the image preview', function() {
      controller = initController(file, provider);
      controller.$onInit();

      expect(angular.element(element.find('esn-attachment-image-preview')).length).to.be.equal(1);
    });

    it('should render the default preview', function() {
      file = {
        _id: 'id',
        contentType: 'video/mp4'
      };
      provider = {
        name: 'defaultPreivew',
        directive: 'esn-attachment-default-preview',
        contentType: 'default'
      };
      controller = initController(file, provider);
      controller.$onInit();

      expect(angular.element(element.find('esn-attachment-default-preview')).length).to.be.equal(1);
    });
  });

  describe('the openClick function', function() {
    it('should open the viewer', function() {
      controller = initController(file, provider);
      controller.onClick();

      expect(esnAttachmentViewerService.open).to.be.calledWith(controller.attachment, controller.gallery);
    });
  });

  describe('the $onDestroy function', function() {
    it('should delete the attachment file in the corresponding gallery', function() {
      controller = initController(file, provider);
      controller.$onDestroy();

      expect(esnAttachmentViewerGalleryService.removeFileFromGallery).to.be.calledWith(controller.attachment, controller.gallery);
    });
  });
});
