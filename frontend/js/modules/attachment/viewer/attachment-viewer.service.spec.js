'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewerService service', function() {
  var $log, esnAttachmentViewerService, esnAttachmentViewerGalleryService;

  beforeEach(function() {
    module('esn.attachment');
    inject(function(_$log_, _esnAttachmentViewerService_, _esnAttachmentViewerGalleryService_) {
      esnAttachmentViewerService = _esnAttachmentViewerService_;
      esnAttachmentViewerGalleryService = _esnAttachmentViewerGalleryService_;
      $log = _$log_;
    });
  });

  describe('The open method', function() {
    it('should use default gallery if there is no gallery specified', function() {
      esnAttachmentViewerGalleryService.getAllFilesInGallery = function() {return [];};

      var spy = sinon.spy(esnAttachmentViewerGalleryService, 'getAllFilesInGallery');
      var defautGallery = esnAttachmentViewerGalleryService.getDefaultGallery();

      esnAttachmentViewerService.open({});

      expect(spy).to.have.been.calledWith(defautGallery);
    });

    it('should get all files in gallery if gallery is specified', function() {
      var spy = sinon.spy(esnAttachmentViewerGalleryService, 'getAllFilesInGallery');

      esnAttachmentViewerGalleryService.addFileToGallery({name: 'file1'}, 'gallery1');

      esnAttachmentViewerService.open({}, 'gallery1');

      expect(spy).to.have.been.calledWith('gallery1');
    });

    it('should log the error if file is not belong to gallery', function() {
      var file1 = {name: 'file1'};
      var file2 = {name: 'file2'};

      esnAttachmentViewerGalleryService.addFileToGallery(file1, 'gallery1');
      esnAttachmentViewerGalleryService.addFileToGallery(file2, 'gallery2');

      esnAttachmentViewerService.open(file2, 'gallery1');

      expect($log.debug.logs[0][0]).to.equal('No such file in gallery');
    });
  });
});
