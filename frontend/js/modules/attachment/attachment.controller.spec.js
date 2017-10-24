'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ESNAttachmentController controller', function() {
  var $controller, $rootScope, $log;
  var esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService;

  beforeEach(function() {
    module('esn.attachment', function($provide) {
      $provide.value('$element', {append: function() {return {};}});
    });

    inject(function(_$controller_, _$rootScope_, _esnAttachmentViewerService_, _esnAttachmentViewerGalleryService_, _esnAttachmentRegistryService_, _$log_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      esnAttachmentRegistryService = _esnAttachmentRegistryService_;
      esnAttachmentViewerGalleryService = _esnAttachmentViewerGalleryService_;
      esnAttachmentViewerService = _esnAttachmentViewerService_;
      $log = _$log_;
    });
  });

  function initController(scope) {
    var $scope = scope || $rootScope.$new();
    var controller = $controller('ESNAttachmentController', {$scope: $scope});

    $scope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    var controller, spy;

    beforeEach(function() {
      controller = initController();
      spy = sinon.spy(esnAttachmentViewerGalleryService, 'addFileToGallery');

      controller.attachment = {_id: 1, name: 'attachment', contentType: 'image/x-png', length: '102302'};
    });

    it('should call addFileToGallery if viewer option is enabled', function() {
      controller.viewer = true;
      controller.$onInit();

      expect(spy).to.have.been.calledOnce;
    });

    it('should not call addFileToGallery if viewer option is disabled', function() {
      controller.viewer = false;
      controller.$onInit();

      expect(spy).not.to.have.been.called;
    });

    it('should call addFileToGallery if viewer option is not set', function() {
      controller.viewer = false;
      controller.$onInit();

      expect(spy).not.to.have.been.called;
    });
  });

  describe('The onClick function', function() {
    var controller, spy;

    beforeEach(function() {
      controller = initController();
      spy = sinon.spy(esnAttachmentViewerService, 'open');
      controller.attachment = {_id: 1, name: 'attachment', contentType: 'image/x-png', length: '102302'};
    });

    it('should call esnAttachmentViewerService.open if viewer option is enabled', function() {
      controller.viewer = true;
      controller.$onInit();
      controller.onClick();

      expect(spy).to.have.been.calledOnce;
    });

    it('should not call esnAttachmentViewerService.open if viewer option is disabled', function() {
      controller.viewer = false;
      controller.$onInit();
      controller.onClick();

      expect(spy).not.to.have.been.called;
    });

    it('should call esnAttachmentViewerService.open if viewer option is not set', function() {
      controller.$onInit();
      controller.onClick();

      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('The renderContent() function', function() {
    var controller;

    beforeEach(function() {
      controller = initController();
    });

    it('should log the error if attachment file is not available', function() {
      controller.renderContent();

      expect($log.debug.logs[0][0]).to.equal('File does not exist or incomplete');
    });

    it('should call esnAttachmentRegistryService.getPreviewer to get previewer', function() {
      var spy = sinon.spy(esnAttachmentRegistryService, 'getPreviewer');

      controller._attachment = {_id: 1, name: 'attachment', contentType: 'image/x-png', length: '102302'};
      controller.renderContent();

      expect(spy).to.have.been.calledOnce;
    });

    it('should call esnAttachmentRegistryService.getDefaultPreviewer if preview option is disabled', function() {
      var spy = sinon.spy(esnAttachmentRegistryService, 'getDefaultPreviewer');

      controller._attachment = {_id: 1, name: 'attachment', contentType: 'image/x-png', length: '102302'};
      controller.preview = false;
      controller.renderContent();

      expect(spy).to.have.been.calledOnce;
    });

    it('should call esnAttachmentRegistryService.getDefaultPreviewer if preview is not available', function() {
      var spy = sinon.spy(esnAttachmentRegistryService, 'getDefaultPreviewer');

      controller._attachment = {_id: 1, name: 'attachment', contentType: 'not-available', length: '102302'};
      controller.renderContent();

      expect(spy).to.have.been.calledOnce;
    });

    it('should not call esnAttachmentRegistryService.getDefaultPreviewer if file preview is available and preview option is enabled', function() {
      var spy = sinon.spy(esnAttachmentRegistryService, 'getDefaultPreviewer');

      controller._attachment = {_id: 1, name: 'attachment', contentType: 'image/x-png', length: '102302'};
      controller.preview = true;

      expect(spy).not.to.have.been.called;
    });
  });
});
