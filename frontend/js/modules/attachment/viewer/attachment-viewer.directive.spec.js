'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewer directive', function() {
  var esnAttachmentViewerService, ESN_AV_VIEW_STATES, element;
  var $rootScope, $compile;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      esnAttachmentViewerService = {
        getCurrentState: sinon.stub(),
        onBuildRegistry: sinon.spy(),
        onBuildViewer: sinon.spy(),
        onClose: sinon.spy(),
        openPrev: sinon.spy(),
        openNext: sinon.spy(),
        downloadFile: sinon.spy()
      };

      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$compile_, _ESN_AV_VIEW_STATES_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      ESN_AV_VIEW_STATES = _ESN_AV_VIEW_STATES_;
    });
  });

  function initDirective() {
    var scope = $rootScope.$new();
    var template = '<esn-attachment-viewer></esn-attachment-viewer>';
    var element = $compile(template)(scope);

    scope.$digest();

    return element;
  }

  it('should set the animationView to false when viewer state is close', function() {
    element = initDirective();
    esnAttachmentViewerService.getCurrentState.returns(ESN_AV_VIEW_STATES.CLOSE_STATE);
    element.scope().$digest();

    expect(element.scope().animationView).to.be.equal(false);
  });

  it('should set the animationView to true when viewer state is open', function() {
    element = initDirective();
    esnAttachmentViewerService.getCurrentState.returns(ESN_AV_VIEW_STATES.OPEN_STATE);
    element.scope().$digest();

    expect(element.scope().animationView).to.be.equal(true);
  });

  describe('The onInit function', function() {
    it('should regist all the elements in modal template', function() {
      element = initDirective();

      expect(esnAttachmentViewerService.onBuildViewer.getCall(0).args[0][0]).to.be.equal(element[0]);
    });
  });

  describe('The closeViewer function', function() {
    it('should close modal when someone clicks', function() {
      element = initDirective();
      element.find('.attachment-viewer').click();

      expect(esnAttachmentViewerService.onClose).to.have.been.called;
    });
  });

  describe('The openPrev function', function() {
    it('should open the previous file in gallery', function() {
      element = initDirective();
      element.find('.av-prev').click();

      expect(esnAttachmentViewerService.openPrev).to.have.been.called;
    });
  });

  describe('The openNext function', function() {
    it('should open the next file in gallery', function() {
      element = initDirective();
      element.find('.av-next').click();

      expect(esnAttachmentViewerService.openNext).to.have.been.called;
    });
  });

  describe('The downloadFile function', function() {
    it('should download the current file', function() {
      element = initDirective();
      element.find('.av-download').click();

      expect(esnAttachmentViewerService.downloadFile).to.have.been.called;
    });
  });
});
