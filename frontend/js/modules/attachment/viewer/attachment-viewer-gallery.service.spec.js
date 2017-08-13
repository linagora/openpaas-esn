'use strict';

/* global chai */

var expect = chai.expect;

describe('The esnAttachmentViewerGalleryService service', function() {
  var esnAttachmentViewerGalleryService;
  var file, gallery, files;

  beforeEach(function() {
    angular.mock.module('esn.attachment');
  });

  beforeEach(inject(function(_esnAttachmentViewerGalleryService_) {
    esnAttachmentViewerGalleryService = _esnAttachmentViewerGalleryService_;
  }));

  beforeEach(function() {
    file = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000
    };
    gallery = 'image';

    esnAttachmentViewerGalleryService.addFileToGallery(file, gallery);
    files = esnAttachmentViewerGalleryService.getAllFilesInGallery(gallery);
  });

  describe('The getDefaultGallery function', function() {
    it('should get the name of default gallery', function() {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();

      expect(defaultGallery).to.be.a('string');
    });
  });

  describe('The addFileToGallery function', function() {
    it('should add the attachment file into the gallery', function() {

      expect(files.indexOf(file)).to.be.equal(0);
    });
  });

  describe('The getAllFilesInGallery function', function() {
    it('should return the files in the gallery by its name', function() {

      expect(files.length).to.be.equal(1);
    });
  });

  describe('The removeFileFromGallery function', function() {
    it('should remove the file in the gallery', function() {
      esnAttachmentViewerGalleryService.removeFileFromGallery(file, gallery);

      expect(files.indexOf(file)).to.be.equal(-1);
    });
  });

});
