'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewerService service', function() {
  var esnAttachmentViewerService, esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, FileSaver, ESN_ATTACHMENT_VIEWERS;
  var file, gallery;
  var files = [];
  var $httpBackend;

  beforeEach(function() {
    esnAttachmentViewerRegistryService = {
      addFileViewerProvider: sinon.spy(),
      getProvider: sinon.spy()
    };
    esnAttachmentViewerGalleryService = {
      getDefaultGallery: sinon.spy(),
      addFileToGallery: sinon.spy(),
      getAllFilesInGallery: sinon.stub(),
      removeFileFromGallery: sinon.spy()
    };
    esnAttachmentViewerViewService = {
      renderViewer: sinon.spy(),
      buildViewer: sinon.spy(),
      openViewer: sinon.spy(),
      calculateSize: sinon.stub(),
      resizeElements: sinon.spy(),
      getState: sinon.spy(),
      removeSelf: sinon.spy()
    };

    FileSaver = {
      saveAs: sinon.spy()
    };

    angular.mock.module('esn.attachment', function($provide) {
       $provide.value('esnAttachmentViewerRegistryService', esnAttachmentViewerRegistryService);
       $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
       $provide.value('esnAttachmentViewerViewService', esnAttachmentViewerViewService);
       $provide.value('FileSaver', FileSaver);
    });
  });

  beforeEach(inject(function(_$httpBackend_, _esnAttachmentViewerService_, _ESN_ATTACHMENT_VIEWERS_) {
    $httpBackend = _$httpBackend_;
    esnAttachmentViewerService = _esnAttachmentViewerService_;
    ESN_ATTACHMENT_VIEWERS = _ESN_ATTACHMENT_VIEWERS_;
  }));

  beforeEach(function() {
    file = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000,
      url: 'api/id'
    };
    gallery = 'image';

    files.push(file);
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('The onInit function', function() {
    it('should add the attachment file into a gallery', function() {

      esnAttachmentViewerService.onInit(file, gallery);

      expect(esnAttachmentViewerGalleryService.addFileToGallery).to.be.calledWith(file, gallery);
    });
  });

  describe('The onBuildRegistry function', function() {
    it('should regist the default viewer provider to the registry', function() {
      var defaultViewer = ESN_ATTACHMENT_VIEWERS.defaultViewer;
      defaultViewer.fitSizeContent = function() {};

      expect(esnAttachmentViewerRegistryService.addFileViewerProvider).to.be.calledWith(defaultViewer);
    });

    it('should regist the image viewer provider to the registry', function() {
      var imageViewer = ESN_ATTACHMENT_VIEWERS.imageViewer;
      imageViewer.fitSizeContent = function() {};

      expect(esnAttachmentViewerRegistryService.addFileViewerProvider).to.be.calledWith(imageViewer);
    });

    it('should regist the video viewer provider to the registry', function() {
      var videoViewer = ESN_ATTACHMENT_VIEWERS.videoViewer;
      videoViewer.fitSizeContent = function() {};

      expect(esnAttachmentViewerRegistryService.addFileViewerProvider).to.be.calledWith(videoViewer);
    });
  });

  describe('The onBuildViewer function', function() {
    it('should build all the elements of the viewer modal', function() {
      var viewer = angular.element('<esn-attachment-viewer></esn-attachment-viewer>');

      esnAttachmentViewerService.onBuildViewer(viewer);

      expect(esnAttachmentViewerViewService.buildViewer).to.be.calledWith(viewer);
    });
  });

  describe('The onOpen, openNext, openPrev function', function() {
    it('should open the file in the viewer modal', function() {

      esnAttachmentViewerGalleryService.getAllFilesInGallery.returns(files);
      esnAttachmentViewerService.onOpen(file, gallery);
      esnAttachmentViewerService.openNext(file, gallery);
      esnAttachmentViewerService.openPrev(file, gallery);

      expect(esnAttachmentViewerViewService.openViewer.callCount).to.be.equal(3);
    });
  });

  describe('The onResize function', function() {
    it('should caculate new size to resize both the content and the modal', function() {
      var sizeOptions = {
        realSize: {
          with: 400,
          height: 200
        }
      };
      var newSize = {
          width: 200,
          height: 100
      };
      var item = angular.element('<div></div>');

      esnAttachmentViewerViewService.calculateSize.returns(newSize);
      esnAttachmentViewerService.onResize(sizeOptions, item);

      expect(item.width()).to.be.equal(200);
      expect(item.height()).to.be.equal(100);
      expect(esnAttachmentViewerViewService.resizeElements).to.be.calledWith(newSize);
    });
  });

  describe('The downloadFile function', function() {
    it('should download the file', function() {
      esnAttachmentViewerGalleryService.getAllFilesInGallery.returns(files);
      esnAttachmentViewerService.onOpen(file, gallery);
      esnAttachmentViewerService.downloadFile();

      $httpBackend.when('GET', file.url).respond(function() {
        return [200, 'data'];
      });
      $httpBackend.expectGET(file.url).respond(200, 'data');
      $httpBackend.flush();

      expect(FileSaver.saveAs.getCall(0).args[1]).to.be.equal(file.name);
    });
  });

  describe('The getCurrentState function', function() {
    it('should get the current state of the modal viewer', function() {

      esnAttachmentViewerService.getCurrentState();

      expect(esnAttachmentViewerViewService.getState).to.be.calledOnce;
    });
  });

  describe('The onDestroy function', function() {
    it('should remove the file in gallery and also remove the viewer', function() {

      esnAttachmentViewerService.onDestroy(file, gallery);

      expect(esnAttachmentViewerGalleryService.removeFileFromGallery).to.be.calledWith(file, gallery);
      expect(esnAttachmentViewerViewService.removeSelf).to.be.calledOnce;
    });
  });

});
