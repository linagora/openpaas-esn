'use strict';

/* global chai */

var expect = chai.expect;

describe('The esnAttachmentViewerViewService service', function() {
  var esnAttachmentViewerViewService, ESN_AV_VIEW_STATES;
  var file, viewer, body, elements;
  var $document, $rootScope, $timeout;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment');

    inject(function(_$document_, _$rootScope_, _$timeout_, _esnAttachmentViewerViewService_, _ESN_AV_VIEW_STATES_) {
      $document = _$document_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      esnAttachmentViewerViewService = _esnAttachmentViewerViewService_;
      ESN_AV_VIEW_STATES = _ESN_AV_VIEW_STATES_;
    });
  });

  beforeEach(function() {
    file = {
       _id: 'id',
      name: 'image.jpg',
      contentType: 'image/jpeg',
      length: 1000
    };

    body = $document.find('body').eq(0);
  });

  describe('The getState function', function() {
    it('should return the open state of the modal', function() {
      esnAttachmentViewerViewService.setState(ESN_AV_VIEW_STATES.OPEN);
      var currentState = esnAttachmentViewerViewService.getState();

      expect(currentState).to.be.equal(ESN_AV_VIEW_STATES.OPEN);
    });

    it('should return the close state of the modal', function() {
      esnAttachmentViewerViewService.setState(ESN_AV_VIEW_STATES.CLOSE);
      var currentState = esnAttachmentViewerViewService.getState();

      expect(currentState).to.be.equal(ESN_AV_VIEW_STATES.CLOSE);
    });
  });

  describe('The renderViewer function', function() {
    it('should append the modal template to body', function() {

      esnAttachmentViewerViewService.renderViewer();
      viewer = body.find('esn-attachment-viewer');
      $rootScope.$digest();

      expect(viewer.length).to.be.equal(1);
    });
  });

  describe('The buildViewer function', function() {
    it('should regist all the elements in the modal', function() {

      esnAttachmentViewerViewService.buildViewer(viewer);
      elements = esnAttachmentViewerViewService.getElements();

      expect(elements.fadeIn.length).to.be.equal(1);
      expect(elements.attachmentViewer.length).to.be.equal(1);
    });
  });

  describe('The openViewer function', function() {
    it('should show the viewer modal and render content', function() {
      var files = [];
      var order;
      var provider = {
        name: 'image',
        directive: 'image',
        contentType: 'image/jpeg',
        sizeOptions: true,
        fitSizeContent: function() {}
      };

      files.push(file);
      order = files.indexOf(file);

      esnAttachmentViewerViewService.buildViewer(viewer);
      esnAttachmentViewerViewService.openViewer(files, order, provider);
      $rootScope.$digest();

      $timeout.flush();
      $timeout.verifyNoPendingTasks();

      expect(elements.attachmentViewer.css('display')).to.be.equal('block');
      expect(body.find('esn-image-viewer').length).to.be.equal(1);
      expect(esnAttachmentViewerViewService.getState()).to.be.equal(ESN_AV_VIEW_STATES.OPEN);
    });
  });

  describe('The calculateSize function', function() {
    it('should caculate a new size from the provided ratio', function() {
      var sizeOptions = {
        realSize: false,
        desiredRatio: {
          desiredRatioWindow: 0.5,
          desiredRatioSize: 1
        }
      };
      var newSize = esnAttachmentViewerViewService.calculateSize(sizeOptions);

      expect(newSize.width).to.be.equal(240);
      expect(newSize.height).to.be.equal(240);
    });

    it('should caculate a new size from the provided real size', function() {
      var sizeOptions = {
        realSize: {
          width: 300,
          height: 300
        },
        desiredRatio: false
      };
      var newSize = esnAttachmentViewerViewService.calculateSize(sizeOptions);

      expect(newSize.width).to.be.equal(160);
      expect(newSize.height).to.be.equal(160);
    });
  });

  describe('The resizeElements function', function() {
    it('should resize elements due to the new size', function() {
      var newSize = {
        width: 100,
        height: 100
      };

      esnAttachmentViewerViewService.buildViewer(viewer);
      esnAttachmentViewerViewService.resizeElements(newSize);

      expect(elements.outerContainer.width()).to.be.equal(100);
      expect(elements.topBar.width()).to.be.equal(100);
      expect(elements.nav.width()).to.be.equal(188);
    });
  });

  describe('The closeViewer function', function() {
    it('should hide the modal', function() {
      var event = {
        target: {
          className: 'attachment-viewer'
        }
      };

      esnAttachmentViewerViewService.buildViewer(viewer);
      esnAttachmentViewerViewService.closeViewer(event);

      $timeout.flush();
      $timeout.verifyNoPendingTasks();

      expect(elements.attachmentViewer.css('display')).to.be.equal('none');
      expect(esnAttachmentViewerViewService.getState()).to.be.equal(ESN_AV_VIEW_STATES.CLOSE);
    });
  });

  describe('The removeSelf function', function() {
    it('should remove the modal', function() {

      esnAttachmentViewerViewService.buildViewer(viewer);
      esnAttachmentViewerViewService.removeSelf();

      expect(body.find('esn-attachment-viewer').length).to.be.equal(0);
    });
  });
});
