'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentViewerGalleryService service', function() {
  var esnAttachmentViewerGalleryService, $log;

  beforeEach(function() {
    module('esn.attachment');
    inject(function(_esnAttachmentViewerGalleryService_, _$log_) {
      esnAttachmentViewerGalleryService = _esnAttachmentViewerGalleryService_;
      $log = _$log_;
    });
  });

  describe('The addFileToGallery function', function() {
    it('should add file to default gallery when gallery is not specified', function() {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();

      esnAttachmentViewerGalleryService.addFileToGallery({});
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery(defaultGallery).length).to.equal(1);
    });

    it('should create new gallery if there is no such gallery', function() {
      esnAttachmentViewerGalleryService.addFileToGallery({}, 'gallery');
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery('gallery').length).to.equal(1);
    });

    it('should add file to gallery if gallery is already exist', function() {
      esnAttachmentViewerGalleryService.addFileToGallery({}, 'gallery');
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery('gallery').length).to.equal(1);

      esnAttachmentViewerGalleryService.addFileToGallery({}, 'gallery');
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery('gallery').length).to.equal(2);

    });
  });

  describe('The removeFileFromGallery function', function() {
    it('should remove file from default gallery if there is no gallery specified', function() {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();
      var file = {};

      esnAttachmentViewerGalleryService.addFileToGallery(file);
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery(defaultGallery).length).to.equal(1);

      esnAttachmentViewerGalleryService.removeFileFromGallery(file);
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery(defaultGallery).length).to.equal(0);
    });

    it('should remove file from gallery if gallery is specified', function() {
      var file = {};

      esnAttachmentViewerGalleryService.addFileToGallery(file, 'gallery');
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery('gallery').length).to.equal(1);

      esnAttachmentViewerGalleryService.removeFileFromGallery(file, 'gallery');
      expect(esnAttachmentViewerGalleryService.getAllFilesInGallery('gallery').length).to.equal(0);
    });

    it('should log the error if file is not belong to gallery', function() {
      var file1 = {name: 'file1'};
      var file2 = {name: 'file2'};

      esnAttachmentViewerGalleryService.addFileToGallery(file1, 'gallery1');
      esnAttachmentViewerGalleryService.addFileToGallery(file2, 'gallery2');

      esnAttachmentViewerGalleryService.removeFileFromGallery(file2, 'gallery1');

      expect($log.debug.logs[0][0]).to.equal('No such file in gallery');
    });
  });
});
