'use strict';

/* global chai */
/* global sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewerService service', function() {
  var files = [];
  var file, gallery, esnAttachmentViewerGalleryService, esnAttachmentViewerService;
  var $document, $rootScope;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      esnAttachmentViewerGalleryService = {
        getDefaultGallery: sinon.stub(),
        getAllFilesInGallery: sinon.stub()
      };

      $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
    });

    inject(function(_$document_, _$rootScope_, _$timeout_, _esnAttachmentViewerService_) {
      $document = _$document_;
      $rootScope = _$rootScope_;
      esnAttachmentViewerService = _esnAttachmentViewerService_;
    });
  });

  beforeEach(function() {
    file = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000
    };
    gallery = 'image';
    files = [file];

    esnAttachmentViewerGalleryService.getDefaultGallery.returns('noname');
    esnAttachmentViewerGalleryService.getAllFilesInGallery.returns(files);
  });

  describe('The open function', function() {
    it('should find the correct file in its gallery', function() {
      esnAttachmentViewerService.open(file, gallery);

      expect(esnAttachmentViewerGalleryService.getDefaultGallery).to.have.been.called;
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery).to.have.been.called;
    });

    it('should append the viewer template to body', function() {
      var body = $document.find('body').eq(0);
      var viewer = body.find('esn-attachment-viewer');
      $rootScope.$digest();

      expect(viewer.length).to.be.equal(1);
    });
  });

  describe('The registerViewer function', function() {
    it('should register the viewer', function() {
      var viewer = {
        open: sinon.spy()
      };

      esnAttachmentViewerService.open(file, gallery);
      esnAttachmentViewerService.registerViewer(viewer);

      expect(viewer.open).to.have.be.calledWith(files, 0);
    });
  });

  describe('The resizeViewer function', function() {
    it('should resize the content due to sizeOptions', function() {
      var viewer = {
        open: sinon.spy(),
        display: sinon.spy()
      };
      var sizeOptions = {
        realSize: false,
        desiredRatio: {
          desiredRatioWindow: 0.5,
          desiredRatioSize: 2
        }
      };
      var item = angular.element('<div></div>');

      esnAttachmentViewerService.open(file, gallery);
      esnAttachmentViewerService.registerViewer(viewer);
      esnAttachmentViewerService.resizeViewer(sizeOptions, item);

      expect(item.width()).to.be.equal(200);
      expect(item.height()).to.be.equal(100);
    });
  });
});
