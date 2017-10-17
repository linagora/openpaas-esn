'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentRegistryService service', function() {
  var esnAttachmentRegistryService;

  beforeEach(function() {
    module('esn.attachment');
    inject(function(_esnAttachmentRegistryService_) {
      esnAttachmentRegistryService = _esnAttachmentRegistryService_;
    });
  });

  describe('The getViewer function', function() {
    it('should return viewer corresponding to file type', function() {
      var file = {contentType: 'video/mp4'};
      var viewer = esnAttachmentRegistryService.getViewer(file.contentType);

      expect(viewer.contentType).to.contain(file.contentType);
    });
  });

  describe('The getPreviewer function', function() {
    it('should return previewer corresponding to file type', function() {
      var file = {contentType: 'image/png'};
      var previewer = esnAttachmentRegistryService.getPreviewer(file.contentType);

      expect(previewer.contentType).to.contain(file.contentType);
    });
  });

  describe('The addViewer function', function() {
    it('should add new viewer into file-viewer registry', function() {
      var viewer = {name: 'newViewer', contentType: 'fileType'};

      esnAttachmentRegistryService.addViewer(viewer);
      expect(esnAttachmentRegistryService.getViewer('fileType').name).to.equal('newViewer');
    });
  });

  describe('The addPreviewer function', function() {
    it('should add new previewer into file-previewer registry', function() {
      var previewer = {name: 'newPreviewer', contentType: 'fileType'};

      esnAttachmentRegistryService.addPreviewer(previewer);
      expect(esnAttachmentRegistryService.getPreviewer('fileType').name).to.equal('newPreviewer');
    });
  });
});
