'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe.only('The esnAttachmentViewer directive', function() {
  var files, file, provider, gallery;
  var esnAttachmentViewerService, esnAttachmentRegistryService, esnAttachmentViewerGalleryService;
  var $timeout, $rootScope, $compile;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      // esnAttachmentViewerService = {
      //   registerViewer: sinon.spy()
      // };
      esnAttachmentRegistryService = {
        getProvider: sinon.stub()
      };
      esnAttachmentViewerGalleryService = {
        getDefaultGallery: sinon.stub(),
        getAllFilesInGallery: sinon.stub()
      };

      //$provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
      $provide.value('esnAttachmentViewerViewService', esnAttachmentRegistryService);
      $provide.value('esnAttachmentViewerGalleryService', esnAttachmentViewerGalleryService);
    });
  });

  beforeEach(function() {
    inject(function(_$timeout_, _$rootScope_, _$compile_, _esnAttachmentViewerService_) {
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      esnAttachmentViewerService = _esnAttachmentViewerService_;
    });
  });

  function initDirective(file, provider) {
    var element;

    gallery = '123';
    files = [file];

    esnAttachmentViewerGalleryService.getDefaultGallery.returns('noname');
    esnAttachmentViewerGalleryService.getAllFilesInGallery.returns(files);
    esnAttachmentRegistryService.getProvider.returns(provider);
    esnAttachmentViewerService.setCurrentItem(files, 0);

    element = $compile('<esn-attachment-viewer></esn-attachment-viewer>')($rootScope.$new());

    return element;
  }

  describe('The open function', function() {
    it('should set up the current file and display the viewer', function() {
      provider = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'],
      };
      file = {
        _id: 'id',
        contentType: 'image/jpeg'
      };

      var element = initDirective(file, provider);

      element.scope().$digest();

      expect(element.scope().display).to.be.equal(true);
      expect(element.scope().numberInGallery).to.be.equal('1/1');
      expect(element.scope().attachment).to.be.equal(file);
      expect(element.scope().displayNav).to.be.equal(false);
    });
  });

  describe('The renderContent function', function() {
    it('should render the image viewer directive', function() {
      var element = initDirective(file, provider);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-image-viewer')).length).to.be.equal(1);
    });

    it('should render the video viewer directive', function() {
      provider = {
        name: 'videoViewer',
        directive: 'esn-attachment-video-viewer',
        contentType: ['video/mp4', 'video/webm', 'video/ogg'],
      };
      file = {
        _id: 'id',
        contentType: 'video/mp4'
      };

      var element = initDirective(file, provider);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-video-viewer')).length).to.be.equal(1);
    });

    it('should render the default viewer directive', function() {
      file = {
        _id: 'id',
        contentType: 'video/mp4'
      };

      var element = initDirective(file, provider);

      element.scope().$digest();

      expect(angular.element(element.find('esn-attachment-video-viewer')).length).to.be.equal(1);
    });
  });

  // it('should show the modal, get the file and hide the main content when viewer state is open', function() {
  //   var currentItem = {
  //     files: [],
  //     order: 0
  //   };
  //   element = initDirective();
  //   esnAttachmentViewerService.getCurrentItem.returns(currentItem);
  //   esnAttachmentViewerViewService.getState.returns(ESN_AV_VIEW_STATES.OPEN);
  //   element.scope().$digest();

  //   it('should set the view to true and hide the main when viewer state is open', function() {

  //     expect(element.scope().view).to.be.equal(true);
  //     expect(element.scope().main).to.be.equal(false);
  //   });

  //   it('should update the file when viewer state is open', function() {

  //     expect(element.scope().file).to.exist;
  //   });
  // });

  // it('should display the content when viewer state is display', function() {
  //   element = initDirective();

  //   esnAttachmentViewerViewService.getState.returns(ESN_AV_VIEW_STATES.DISPLAY);
  //   element.scope().$digest();

  //   expect(element.scope().main).to.be.equal(true);
  // });

  // describe('The onInit function', function() {
  //   it('should regist all the elements in modal template', function() {
  //     element = initDirective();

  //     expect(esnAttachmentViewerViewService.buildViewer.getCall(0).args[0][0]).to.be.equal(element[0]);
  //   });
  // });

  // describe('The closeViewer function', function() {
  //   it('should close modal when someone clicks', function() {
  //     element = initDirective();
  //     element.find('.attachment-viewer').click();

  //     expect(esnAttachmentViewerViewService.closeViewer).to.have.been.called;
  //   });
  // });

  // describe('The openPrev function', function() {
  //   it('should open the previous file in gallery', function() {
  //     element = initDirective();
  //     element.find('.av-prev').click();

  //     expect(esnAttachmentViewerService.openPrev).to.have.been.called;
  //   });
  // });

  // describe('The openNext function', function() {
  //   it('should open the next file in gallery', function() {
  //     element = initDirective();
  //     element.find('.av-next').click();

  //     expect(esnAttachmentViewerService.openNext).to.have.been.called;
  //   });
  // });
});
