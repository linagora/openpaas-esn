'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewer directive', function() {
  var files = [];
  var esnAttachmentViewerService, esnAttachmentRegistryService, esnAttachmentViewerGalleryService;
  var $rootScope, $compile;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      esnAttachmentRegistryService = {
        getViewer: sinon.stub(),
        getDefaultViewer: sinon.stub()
      };
      esnAttachmentViewerGalleryService = {
        getDefaultGallery: sinon.stub(),
        getAllFilesInGallery: sinon.stub()
      };

      $provide.value('esnAttachmentViewerViewService', esnAttachmentRegistryService);
      $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
    });
  });

  beforeEach(function() {
    var image = file('/api/files/id', 'image', 'image/jpeg', 1);
    var video = file('/api/files/id', 'video', 'video/mp4', 1);
    var attachment = file('/api/files/id', 'default', 'application/javascript', 1);

    files.push(image, video, attachment);

    inject(function(_$rootScope_, _$compile_, _esnAttachmentViewerService_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      esnAttachmentViewerService = _esnAttachmentViewerService_;
    });
  });

  function file(url, name, contentType, length) {
    return {
      url: url,
      name: name,
      contentType: contentType,
      length: length
    };
  }

  function initDirective(order, _viewer) {
    var element;
    var defaultViewer = {
      name: 'defaultViewer',
      directive: 'esn-attachment-default-viewer'
    };

    esnAttachmentViewerGalleryService.getDefaultGallery.returns('noname');
    esnAttachmentViewerGalleryService.getAllFilesInGallery.returns(files);
    esnAttachmentRegistryService.getViewer.returns(_viewer);
    esnAttachmentRegistryService.getDefaultViewer.returns(defaultViewer);
    esnAttachmentViewerService.setCurrentItem(files, order);

    element = $compile('<esn-attachment-viewer></esn-attachment-viewer>')($rootScope.$new());

    return element;
  }

  describe('The open function', function() {

    it('should set up the current file and display the viewer', function() {
      var viewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      var element = initDirective(0, viewer);

      element.scope().$digest();

      expect(element.scope().display).to.be.true;
      expect(element.scope().numberInGallery).to.be.equal('1/3');
      expect(element.scope().attachment).to.deep.equal(files[0]);
      expect(element.scope().displayNav).to.be.true;
    });
  });

  describe('The renderContent function', function() {
    it('should render the image viewer directive', function() {
      var viewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      var element = initDirective(0, viewer);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-image-viewer')).length).to.be.equal(1);
    });

    it('should render the video viewer directive', function() {
      var viewer = {
        name: 'videoViewer',
        directive: 'esn-attachment-video-viewer',
        contentType: ['video/mp4', 'video/webm', 'video/ogg']
      };
      var element = initDirective(1, viewer);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-video-viewer')).length).to.be.equal(1);
    });

    it('should render the default viewer directive', function() {
      var element = initDirective(2, false);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-default-viewer')).length).to.be.equal(1);
    });
  });

   describe('The openPrev function', function() {
    it('should open the previous file in gallery', function() {
      var viewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      var element = initDirective(0, viewer);

      element.scope().$digest();
      element.find('.av-prev').click();

      expect(element.scope().attachment).to.deep.equal(files[2]);
    });
  });

  describe('The openNext function', function() {
    it('should open the next file in gallery', function() {
      var viewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };
      var element = initDirective(0, viewer);

      element.scope().$digest();
      element.find('.av-next').click();

      expect(element.scope().attachment).to.deep.equal(files[1]);
    });
  });

  describe('The closeViewer function', function() {
    var viewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      };

    it('should close viewer when someone clicks to the close button', function() {
      var element = initDirective(0, viewer);

      element.scope().$digest();
      element.find('.av-closeButton').click();

      expect(element.scope().display).to.be.false;
    });

    it('should close viewer when someone clicks outside the content', function() {
      var element = initDirective(0, viewer);

      element.scope().$digest();
      element.find('.av-outerContainer').click();

      expect(element.scope().display).to.be.false;
    });
  });
});
